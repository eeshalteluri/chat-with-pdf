import ChatComponent from '@/components/ChatComponent';
import ChatSidebar from '@/components/ChatSidebar';
import PDFViewer from '@/components/PDFViewer';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { checkSubscription } from '@/lib/subscription';
import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import React from 'react'

type Props = {
    params: Promise<{
        chatId : string;
    }>
}

const ChatPage = async ({params} : Props) => {
    const {chatId} = await params;
    const {userId} = await auth();

    //IF no user is logged in
    if(!userId) {
        return redirect("/sign-in");
    }

    //If no chats for the particular user are present
    const _chats = await db.select().from(chats).where(eq(chats.userId, userId));

    {/*
        if(!_chats) {
        return redirect('/');
    }

    //If particular chat ID is not present
    if(!_chats.find((chat) => chat.id === parseInt(chatId))) {
        return redirect('/');
    }
    */}

    //Find current chat details
    const currentChat = _chats.find(chat => chat.id === parseInt(chatId));
    const isPro = await checkSubscription()

  return (
    <div className='flex max-h-screen overflow-scroll scrollbar-hide'>
        <div className='flex w-full max-h-screen overflow-scroll scrollbar-hide'>
            {/*Chat Sidebar */}
            <div className='flex-[1] max-w-xs'>
                <ChatSidebar 
                    chats={_chats} 
                    chatId={parseInt(chatId)} 
                    isPro={isPro} 
                />
            </div>
            {/* PDF Viewer */}
            <div className='min-h-screen p-4 overflow-scroll flex-[5] scrollbar-hide'>
                <PDFViewer pdf_url={currentChat?.pdfUrl || ''}/>
            </div>
            {/* Chat component */}
            <div className='flex-[3] border-l-4 border-l-state-200'>
                <ChatComponent chatId={parseInt(chatId)}/>
            </div>
        </div>
    </div>
  )
}

export default ChatPage