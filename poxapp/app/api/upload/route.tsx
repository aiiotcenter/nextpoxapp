import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import Busboy from "busboy";
import crypto from "crypto"; // For generating unique file names

export const config = {
    api: {
        bodyParser: false, // Disable automatic body parsing
    },
};

export async function POST(req: NextRequest) {
    try {
        const contentType = req.headers.get("content-type");
        if (!contentType || !contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                { error: "Missing or invalid Content-Type" },
                { status: 400 }
            );
        }

        // Ensure the uploads directory exists
        const uploadDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Return a promise from the POST function
        return new Promise<NextResponse>((resolve, reject) => {
            const busboy = Busboy({ headers: Object.fromEntries(req.headers) });

            let savedFilePath = "";

            busboy.on("file", (fieldname, file, fileInfo) => {
                // Destructure the fileInfo to get the filename
                const { filename } = fileInfo;

                // Extract file extension
                const ext = path.extname(filename);

                // Generate a unique file name (e.g., "image-1709730198473-a1b2c3.jpg")
                const uniqueName = `image-${Date.now()}-${crypto
                    .randomBytes(6)
                    .toString("hex")}${ext}`;

                savedFilePath = path.join(uploadDir, uniqueName);

                const writeStream = fs.createWriteStream(savedFilePath);
                file.pipe(writeStream);

                writeStream.on("finish", () => {
                    // Respond once the file is written successfully
                    resolve(
                        NextResponse.json(
                            { filePath: `/uploads/${uniqueName}` },
                            { status: 200 }
                        )
                    );
                });

                writeStream.on("error", () => {
                    reject(
                        NextResponse.json(
                            { error: "File write error" },
                            { status: 500 }
                        )
                    );
                });
            });

            busboy.on("error", (err) => {
                reject(
                    NextResponse.json(
                        { error: "Upload failed", details: (err as Error).message },
                        { status: 500 }
                    )
                );
            });

            // Convert NextRequest body into a readable stream and pipe it into busboy
            Readable.from(req.body as any).pipe(busboy); // eslint-disable-line
        });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "File upload failed", details: (error as Error).message },
            { status: 500 }
        );
    }
}
