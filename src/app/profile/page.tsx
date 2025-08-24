
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSession } from "@/lib/auth-actions-client";
import { getUserById } from "@/lib/user-actions-client";
import type { Session, User, Room, Notification } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { getUserRooms } from "@/lib/room-actions-client";
import { getNotifications } from "@/lib/notification-actions-client";

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const sessionData = await getSession();
      setSession(sessionData);

      if (sessionData?.userId) {
        const [userData, roomsData, notificationsData] = await Promise.all([
          getUserById(sessionData.userId),
          getUserRooms(sessionData.userId),
          getNotifications(sessionData.userId),
        ]);
        setUser(userData);
        setRooms(roomsData);
        setNotifications(notificationsData);
      }
      setIsLoading(false);
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <AppShell rooms={[]} tasks={[]} session={null} notifications={[]}>
        <div className="mx-auto max-w-4xl">
          <Skeleton className="h-10 w-1/3 mb-8" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
               <div className="pt-4 space-y-2 text-sm">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
            </CardContent>
            <CardFooter>
               <Skeleton className="h-10 w-32" />
            </CardFooter>
          </Card>
        </div>
      </AppShell>
    );
  }
  
  if (!session || !user) {
    return (
      <AppShell rooms={rooms} tasks={[]} session={session} notifications={notifications}>
         <main className="flex-1 p-4 sm:p-6 md:p-8">
           <div className="mx-auto max-w-4xl text-center">
             <p>Could not load user profile. Please try logging in again.</p>
             <Button asChild className="mt-4">
               <Link href="/login">Login</Link>
             </Button>
           </div>
         </main>
      </AppShell>
    );
  }

  const displayName = user.displayName || user.email;
  const firstLetter = displayName ? displayName[0].toUpperCase() : "?";

  return (
    <AppShell rooms={rooms} tasks={[]} session={session} notifications={notifications}>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
          My Profile
        </h1>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={user.avatarUrl || `https://placehold.co/100x100.png?text=${firstLetter}`}
                  alt={displayName}
                  data-ai-hint="avatar"
                />
                <AvatarFallback>{firstLetter}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xl font-semibold">{displayName}</p>
                <p className="text-md text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="pt-4 space-y-2 text-sm">
              <p>
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p>
                <span className="font-medium">User ID:</span> {user.id}
              </p>
              <p>
                <span className="font-medium">Email Notifications:</span> {user.emailNotifications ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </CardContent>
           <CardFooter>
            <Button asChild>
              <Link href="/settings">
                <Pencil className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </AppShell>
  );
}
