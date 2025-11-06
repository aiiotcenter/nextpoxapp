import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { prediction, question } = await request.json();

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful assistant specializing in disease vector identification and public health. Provide accurate, concise information about vectors like mosquitoes, ticks, fleas, and bed bugs.'
                    },
                    {
                        role: 'user',
                        content: `The classification result is: ${prediction}. User question: ${question}`
                    }
                ],
                max_tokens: 200,
                temperature: 0.7
            })
        });

        const data = await response.json();

        // Log the full response to see what's wrong
        console.log('OpenAI Response:', data);
            
        if (data.error) {
            console.error('OpenAI Error:', data.error);
            return NextResponse.json({ 
                answer: `OpenAI API Error: ${data.error.message}` 
            }, { status: 500 });
        }
        
        if (!data.choices || data.choices.length === 0) {
            return NextResponse.json({ 
                answer: 'No response received from OpenAI.' 
            }, { status: 500 });
        }
        
        return NextResponse.json({ 
            answer: data.choices[0].message.content 
        });

    } catch (error) {
        console.error('AI error:', error);
        return NextResponse.json({ 
            answer: 'Sorry, I could not process your question at this time.' 
        }, { status: 500 });
    }
}