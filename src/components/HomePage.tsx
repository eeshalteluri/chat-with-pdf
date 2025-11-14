"use client";

import FileUpload from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { checkSubscription } from "@/lib/subscription";
import { UserButton } from "@clerk/nextjs";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SubscriptionButton from "./SubscriptionButton";
import { ChatType } from "@/lib/db/schema";

export default function HomePage({ isAuth, isPro, firstChat }: { isAuth: boolean, isPro: boolean, firstChat: ChatType | null }) {
  const router = useRouter();
  console.log("Is Pro: ", isPro);
  
  const handleChats = () => {
    router.push("/chats");
  };

  return (
    <div className="w-screen min-h-screen bg-linear-to-r from-rose-100 to-teal-100">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center">
            <h1 className="mr-3 text-5xl font-semibold">Chat with my PDF</h1>
            <UserButton />
          </div>

          <div className="flex mt-2">
            {isAuth && firstChat && 
            <Link href={`/chats/${firstChat.id}`}>
              <Button>Go to Chats</Button>
            </Link>
            }
            <div className="ml-3">
              <SubscriptionButton isPro={isPro}/>
            </div>
          </div>

          <p className="max-w-xl mt-1 text-lg text-slate-600">
            Join millions of students, researchers, and professionals to instantly answer questions and understand research with AI.
          </p>

          <div className="w-full mt-4">
            {isAuth ? (
              <FileUpload />
            ) : (
              <Link href="/sign-in">
                <Button>
                  Login to Get Started
                  <LogIn className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
