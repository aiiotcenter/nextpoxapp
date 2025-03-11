import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ image: string }> }
) {

    const { image } = await params;
    const imagePath = path.join(process.cwd(), "uploads", image);

    if (!fs.existsSync(imagePath)) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    const file = fs.readFileSync(imagePath);
    const ext = path.extname(image).toLowerCase();

    let contentType = "image/jpeg"; // Default MIME type
    if (ext === ".png") contentType = "image/png";
    else if (ext === ".webp") contentType = "image/webp";
    else if (ext === ".gif") contentType = "image/gif";

    return new NextResponse(file, {
        status: 200,
        headers: {
            "Content-Type": contentType,
        },
    });
}
