import { NextRequest, NextResponse } from "next/server";

const BACKENDURL = "http://backend:7135";

export async function POST(request: NextRequest) {
    const body = await request.json();
    if (body.fileName) {
        const { fileName } = body;

        console.log("fileName: ", fileName);

        const result = await fetch(
            `${BACKENDURL}/predict/?imageName=${fileName}&&modelInputFeatureSize=300&&modelFilename=model_10-0.92.keras`,
            {
                method: "GET",
            }
        );

        const classificationResults = await result.text();

        return new NextResponse(classificationResults, { status: 200 });
    }

    return NextResponse.json(
        {
            error: "something went wrong",
        },
        { status: 400 }
    );
}
