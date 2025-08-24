
import { getSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { getUserRooms } from "@/lib/room-actions";
import { AppShell } from "@/components/app/app-shell";

export default async function Home() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const rooms = await getUserRooms(session.userId);
  
  // If the user has no rooms, redirect to a page to create one
  if (!rooms || rooms.length === 0) {
    redirect("/rooms/new");
  }

  // Redirect to the first room in the list by default
  redirect(`/rooms/${rooms[0].id}`);
}
