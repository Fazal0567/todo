import { getTasks } from "@/lib/actions";
import HomePage from "@/components/app/home-page";

export default async function Home() {
  const tasks = await getTasks();

  return <HomePage serverTasks={tasks} />;
}
