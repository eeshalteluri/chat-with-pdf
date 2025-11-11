import React from "react";
import { UIMessage } from "ai";
import { cn } from "@/lib/utils";

type Props = {
  messages: UIMessage[];
};

const MessageList = ({ messages }: Props) => {
  if (!messages) return null;

  return (
    <div className="flex flex-col gap-2 px-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn("flex", {
            "justify-end pl-10": message.role === "user",
            "justify-start pr-10": message.role === "assistant",
          })}
        >
          <div
            className={cn(
              "rounded-lg px-3 text-sm py-1 shadow-md ring-1 ring-gray-900/10",
              {
                "bg-blue-800 text-white": message.role === "user",
                "bg-gray-100 text-gray-900": message.role === "assistant",
              }
            )}
          >
            {/* UIMessage uses .parts, not .content */}
            <p>
              {message.parts
                ?.map((part, index) =>
                  part.type === 'text' ? <span key={index}>{part.text}</span> : null,
                )}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
