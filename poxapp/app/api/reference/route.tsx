import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const config = {
    api: {
        bodyParser: true, // Default body parser
    },
};

export async function POST(request: NextRequest) {
    try {
        // Parse the JSON body
        const body = await request.json();
        const { folderName, fileName } = body;

        // Ensure the uploads directory exists
        const uploadDir = path.join(process.cwd(), "uploads");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Ensure the subdirectory (e.g., chickenpox) exists
        const subDir = path.join(uploadDir, folderName);
        if (!fs.existsSync(subDir)) {
            fs.mkdirSync(subDir, { recursive: true });
        }

        if (fileName) {
            // Define the source file path (assuming it's already in the uploads folder)
            const sourceFilePath = path.join(uploadDir, fileName);

            // Ensure the source file exists
            if (!fs.existsSync(sourceFilePath)) {
                return NextResponse.json(
                    { error: "Source file not found" },
                    { status: 404 }
                );
            }

            // Define the new file path in the subdirectory
            const destinationFilePath = path.join(subDir, fileName);

            // Copy the file to the new location
            fs.copyFileSync(sourceFilePath, destinationFilePath);

            return NextResponse.json(
                { filePath: `/uploads/${folderName}/${fileName}` },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { error: "No file name provided" },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            {
                error: "File operation failed",
                details: (error as Error).message,
            },
            { status: 500 }
        );
    }
}
