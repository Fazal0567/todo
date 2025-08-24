
import { AppShell } from "@/components/app/app-shell";
import { getSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddRoomDialog } from "@/components/app/add-room-dialog";
import { getUserRooms } from "@/lib/room-actions";
import { CreateRoomForm } from "./create-room-form";

export default async function NewRoomPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const rooms = await getUserRooms(session.userId);

  return (
    <AppShell rooms={rooms} tasks={[]} session={session}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create a New Room</CardTitle>
            <CardDescription>
              Start a new collaborative space for your tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRoomForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
