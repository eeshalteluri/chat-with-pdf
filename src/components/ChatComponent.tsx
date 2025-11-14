"use client"
import React, { useEffect, useState, useMemo } from 'react' // Import useMemo
import { Input } from './ui/input'
import {useChat} from "@ai-sdk/react"
import { Loader2, Send } from 'lucide-react'
import { Button } from './ui/button'
import MessageList from './MessageList'
import { DefaultChatTransport, TextUIPart, UIMessage } from 'ai'; // Ensure UIMessage is imported
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { messageType } from '@/lib/db/schema'
// Remove unnecessary import: import { messages } from '@/lib/db/schema' 

type Props = {chatId: number}

// --- NEW COMPONENT: Encapsulates useChat and UI Rendering ---
type ChatRendererProps = {
    chatId: number;
    initialMessages: UIMessage[];
}

const ChatRenderer = ({ chatId, initialMessages }: ChatRendererProps) => {
    // This hook is guaranteed to initialize with the correct history array
    const [ input, setInput ] = useState('');
    const { messages, sendMessage, status }= useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: { chatId },
        }),
        messages: initialMessages, // Now stable and correct
    });

    useEffect(() => {
        const messageContainer = document.getElementById("message-container");
        if(messageContainer) {
            messageContainer.scrollTo({ top: messageContainer.scrollHeight, behavior: "smooth" });
        }
        console.log("ChatRenderer Messages (History loaded): ", messages);
    }, [messages]);

    return (
        <div className='relative max-h-screen overflow-scroll scrollbar-hide' id='message-container'>
            {/* Header */}
            <div className='sticky top-0 p-2 bg-white h-fit'><h3 className='text-xl font-bold'>Chat</h3></div>
            
            {/* Message List */}
            <MessageList messages={messages}/>

            {/* Form to send message */}
            <form className='sticky bottom-0 inset-x-0 px-2 py-4 bg-white'
                onSubmit={e => {
                    e.preventDefault();
                    sendMessage({ text: input});
                    setInput('');
                }}>
                <div className='flex'>
                    <Input 
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={status !== 'ready'}
                    placeholder='Ask any question....'
                    />
                    <Button type="submit" disabled={status !== 'ready'} className="bg-blue-600 ml-2">
                        <Send className='h-4 w-4'/>
                    </Button>
                </div>
            </form>
        </div>
    );
}

// --- MAIN COMPONENT: Handles Data Fetching and Initialization ---
const ChatComponent = ({chatId}: Props) => {
    // Include isSuccess and explicitly type data
    const { data, isLoading, isSuccess } = useQuery<UIMessage[]>({
        queryKey: ["chat", chatId],
        queryFn: async () => {
            const response = await axios.post('/api/get-messages', { chatId });
            
            // Access the nested property and map the data
            const rawMessages = response.data?._messages; 
            const rawData = Array.isArray(rawMessages) ? rawMessages : [];

            return rawData.map((msg: messageType) => {
                const textPart: TextUIPart = {
                    type: 'text',
                    text: msg.content || "",
                };
                return {
                    id: msg.id?.toString() ?? crypto.randomUUID(),
                    role: (msg.role === "user" ? "user" : "assistant") as "user" | "assistant",
                    parts: [textPart], 
                }
            }) as UIMessage[];
        },
        staleTime: Infinity, // Prevent refetching
    });

    // Memoize the initial messages to provide a stable reference
    const initialMessages = useMemo(() => {
        if (isSuccess && data) {
            return data;
        }
        return [];
    }, [isSuccess, data]);


    if (isLoading && !isSuccess) {
        return (
            <div className='flex items-center justify-center h-full'>
                <Loader2 className='w-6 h-6 animate-spin text-blue-500' />
                <p className='ml-2 text-gray-500'>Loading chat history...</p>
            </div>
        );
    }
    
    console.log("Previous messages (Final Check): ", initialMessages)

    // CRITICAL STEP: Render the ChatRenderer with a key that forces re-initialization
    // The key ensures that ChatRenderer (and useChat) mounts AFTER data is ready.
    return (
        <ChatRenderer 
            // The key forces a remount when isSuccess becomes true
            key={`${chatId}-${isSuccess}`} 
            chatId={chatId} 
            initialMessages={initialMessages} 
        />
    )
}

export default ChatComponent