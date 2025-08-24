
import { getTasks } from "@/lib/actions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import HomePage from "@/components/app/home-page";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const tasks = await getTasks();

  return <HomePage serverTasks={tasks} session={session} />;
}
