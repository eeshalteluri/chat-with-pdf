"use client"
import React, { useState } from 'react'
import { Input } from './ui/input'
import {useChat} from "@ai-sdk/react"
import { Send } from 'lucide-react'
import { Button } from './ui/button'
import MessageList from './MessageList'

type Props = {}

const ChatComponent = (props: Props) => {
  const [ input, setInput ] = useState('');
  const { messages, sendMessage, status }= useChat();
  return (
    <div className='relative max-h-screen overflow-scroll scrollbar-hide'>
        {/* Header */}
        <div className='sticky top-0 p-2 bg-white h-fit'>
            <h3 className='text-xl font-bold'>Chat</h3>
        </div>

        {/* Message List */}
        <MessageList messages={messages}/>

        {/* Form to send message */}
        <form
        className='sticky bottom-0 inset-x-0 px-2 py-4 bg-white'
          onSubmit={
            e => {
              e.preventDefault();
              sendMessage({ text: input});
              setInput('');
            }
          }
        >
          <div className='flex'>
            <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={status !== 'ready'}
            placeholder='Ask any question....'
           />
           <Button 
              type="submit" 
              disabled={status !== 'ready'}
              className="bg-blue-600 ml-2"
            >
            <Send className='h-4 w-4'/>
           </Button>
          </div>
        </form>
    </div>
  )
}

export default ChatComponent