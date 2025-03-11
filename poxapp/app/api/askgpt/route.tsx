import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const body = await request.json();

    try {
        if (body) {
            const { prediction, question, absoluteImageURL } = body;
            const result = await askChatGPT(
                prediction,
                question,
                absoluteImageURL
            );
            return new NextResponse(result, { status: 200 });
        }
    } catch (error) {
        return NextResponse.json(error, { status: 200 });
    }
}

async function askChatGPT(__prediction: string, __question: string, absoluteImageURL: string) {
    const prediction = __prediction.trim();
    const question = __question.trim();

    const OPENAI_KEY = process.env.OPENAI_KEY;
    console.log("OPENAI_KEY: ", OPENAI_KEY);

    const prompt = `The prediction is "${prediction}", The image is from ${absoluteImageURL}. ${question}`;

    console.log("prompt: ", prompt);

    if (!OPENAI_KEY) {
        alert("OPEN AI KEY DOES NOT ESIT");
        return;
    }

    try {
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: prompt }],
                    max_tokens: 100,
                }),
            }
        );

        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        console.error(error);
        return new Error("GPT Failed To Respond");
    }
}
