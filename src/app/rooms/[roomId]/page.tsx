
import { getTasks } from "@/lib/actions";
import { getSession } from "@/lib/auth-client";
import { AppShell } from "@/components/app/app-shell";
import { getUserRooms, addUserToRoom, getRoom } from "@/lib/room-actions";
import { redirect } from "next/navigation";
import HomePage from "@/components/app/home-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { InviteUserForm } from "./invite-user-form";
import { LeaveRoomButton } from "./leave-room-button";
import { Separator } from "@/components/ui/separator";


export default async function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  const session = await getSession();
  const { roomId } = params;

  if (!session) {
    // If not logged in, show a public page inviting them to log in or sign up
    // to join the collaboration.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Join the Collaboration</CardTitle>
            <CardDescription>
              You've been invited to a collaborative task room. Please sign in or create an account to join.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
             <Button asChild>
                <Link href={`/login?redirectTo=/rooms/${roomId}`}>Login</Link>
            </Button>
            <Button asChild variant="outline">
               <Link href={`/signup?redirectTo=/rooms/${roomId}`}>Sign Up</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If the user is logged in, try to add them to the room if they aren't already a member.
  await addUserToRoom(roomId, session.email);

  // Now, verify they have access.
  const room = await getRoom(roomId, session.userId);
  if (!room) {
    // If they still don't have access (e.g., invalid room), redirect.
    return (
       <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Room Not Found</CardTitle>
            <CardDescription>
              This room doesn't exist or you don't have permission to access it.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild>
                <Link href="/">Back to My Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const [tasks, rooms] = await Promise.all([
    getTasks(roomId),
    getUserRooms(session.userId),
  ]);


  return (
    <AppShell rooms={rooms} tasks={tasks} session={session}>
      <div className="mb-8 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Invite a Teammate</CardTitle>
            <CardDescription>Share this room with others to collaborate on tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteUserForm roomId={roomId} />
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Room Actions</CardTitle>
                <CardDescription>Manage your membership in this room.</CardDescription>
            </CardHeader>
            <CardContent>
                <LeaveRoomButton roomId={roomId} roomName={room.name} />
            </CardContent>
        </Card>
      </div>
      <HomePage serverTasks={tasks} session={session} />
    </AppShell>
  );
}
