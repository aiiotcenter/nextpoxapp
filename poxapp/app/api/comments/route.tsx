import prisma from "@/prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    const results = await prisma.comments.findMany();
    return NextResponse.json(results, { status: 200 });
}

export async function POST(request: NextRequest) {
    const body = await request.json();

    if (body) {
        const { comment, imagePath, classification, changedClassification } =
            body;

        const result = await prisma.comments.create({
            data: {
                comment,
                imagePath,
                classification,
                changedClassification,
            },
        });

        if (result) return NextResponse.json(result, { status: 200 });
        else
            return NextResponse.json(
                { error: "something went wrong" },
                { status: 400 }
            );
    }

    return NextResponse.json(
        { error: "something went wrong" },
        { status: 400 }
    );
}
