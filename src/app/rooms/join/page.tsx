
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
import { JoinRoomForm } from "./join-room-form";
import Link from "next/link";

export default async function JoinRoomPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirectTo=/rooms/join");
  }

  const rooms = await getUserRooms(session.userId);

  return (
    <AppShell rooms={rooms} tasks={[]} session={session}>
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join an Existing Room</CardTitle>
            <CardDescription>
              Paste the link to the room you want to join.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinRoomForm />
             <p className="mt-4 text-center text-sm text-muted-foreground">
              Or, you can{" "}
              <Link
                href="/rooms/new"
                className="font-semibold text-primary hover:underline"
              >
                create a new room
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
