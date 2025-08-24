import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ProfilePage() {
  const session = await getSession();

  // 🔒 Protect route
  if (!session) {
    redirect("/login");
  }

  const firstLetter = session.email ? session.email[0].toUpperCase() : "?";

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
                  <AvatarImage src="/avatars/01.png" alt={session.email} />
                  <AvatarFallback>{firstLetter}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{session.email}</p>
                  <p className="text-sm text-muted-foreground">
                    User ID: {session.userId}
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
