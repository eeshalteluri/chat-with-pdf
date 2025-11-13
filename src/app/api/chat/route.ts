import { getContext } from '@/lib/context';
import { db } from '@/lib/db';
import { chats, messages as _messages } from '@/lib/db/schema';
import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, ModelMessage, streamText, UIMessage } from 'ai';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

//export const runtime = "edge";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

function extractTextFromUIMessage(message: UIMessage): string {
    // Filter for parts where type is 'text' and join the text content
    return (
        message.parts
            .filter((part) => part.type === 'text')
            .map((part) => part.text)
            .join(' ') // Join multiple text parts with a space
    );
}

export async function POST(req: Request) {
  const { messages, chatId }: { messages: UIMessage[], chatId: number } = await req.json();

  const _chats = await db.select().from(chats).where(eq(chats.id, chatId));
  if(_chats.length != 1) {
    return NextResponse.json({'error': 'chat not found'}, {status: 404})
  }
  const fileKey = _chats[0].fileKey;
  const lastMessage = messages[messages.length-1];

  const userQuery = extractTextFromUIMessage(lastMessage);
  const context = await getContext(userQuery, fileKey);

  // FIX 1: Create the System Prompt content string
    const systemContent = `AI assistant is a brand new, powerful, human-like artificial intelligence.
    The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
    AI is a well-behaved and well-mannered individual.
    AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
    AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
    AI assistant is a big fan of Pinecone and Vercel.
    START CONTEXT BLOCK
    ${context}
    END OF CONTEXT BLOCK
    AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
    If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
    AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
    AI assistant will not invent anything that is not drawn directly from the context.
    `;
    
    // FIX 2: Create the system message using the ModelMessage structure
    // We cast it to ModelMessage to ensure type compatibility.
    const systemPrompt: ModelMessage = {
        role: "system",
        content:systemContent, // Content must be an array of Content parts
    };
    const userMessages = messages.filter((message) => message.role === "user");

    const allMessages = [systemPrompt, ...convertToModelMessages(messages)];

  const result = streamText({
    model: openai('gpt-4.1'),
    system: 'You are a helpful assistant.',
    messages: allMessages,

    onFinish: async(completion) => {
        // Save AI message to db
        await db.insert(_messages).values({
            chatId,
            content: completion.text, // Access the text property from the completion object
            role: "system" // Should be 'assistant' for the AI response
        });
    },
  });

  if(result) {
    await db.insert(_messages).values({
            chatId,
            content: extractTextFromUIMessage(lastMessage),
            role: "user",
        })
  }

  return result.toUIMessageStreamResponse();
}
