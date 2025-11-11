import { auth } from "@clerk/nextjs/server";
import HomePage from "@/components/HomePage";

export default async function Home() {
  const { userId } = await auth();
  const isAuth = !!userId;

  return <HomePage isAuth={isAuth} />;
}
