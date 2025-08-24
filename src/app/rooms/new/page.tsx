
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
import { getUserRooms } from "@/lib/room-actions";
import { CreateRoomForm } from "./create-room-form";
import Link from "next/link";
import { getNotifications } from "@/lib/notification-actions";

export default async function NewRoomPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirectTo=/rooms/new");
  }

  const [rooms, notifications] = await Promise.all([
    getUserRooms(session.userId),
    getNotifications(session.userId),
  ]);

  return (
    <AppShell rooms={rooms} tasks={[]} session={session} notifications={notifications}>
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
            <p className="mt-4 text-center text-sm text-muted-foreground">
              Or, you can{" "}
              <Link
                href="/rooms/join"
                className="font-semibold text-primary hover:underline"
              >
                join an existing room
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
