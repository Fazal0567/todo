
"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "@/components/app/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getSession } from "@/lib/auth-actions-client";
import { getUserById } from "@/lib/user-actions-client";
import type { Session, User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadData() {
      const sessionData = await getSession();
      setSession(sessionData);
      if (sessionData?.userId) {
        const userData = await getUserById(sessionData.userId);
        setUser(userData);
      }
    }
    loadData();
  }, []);

  if (!session || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <AppHeader tasks={[]} session={session} />
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <Skeleton className="h-10 w-1/3 mb-8" />
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/4" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div>
                    <Skeleton className="h-6 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }
  
  const displayName = session.displayName || user.displayName || user.email;
  const firstLetter = displayName ? displayName[0].toUpperCase() : "?";

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader tasks={[]} session={session} />

      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            My Profile
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={`https://placehold.co/100x100.png`} alt={displayName} />
                  <AvatarFallback>{firstLetter}</AvatarFallback>
                </Avatar>
                <div>
                   <p className="text-xl font-semibold">{displayName}</p>
                   <p className="text-md text-muted-foreground">{user.email}</p>
                   <p className="text-sm text-muted-foreground pt-2">
                    User ID: {user.id}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
