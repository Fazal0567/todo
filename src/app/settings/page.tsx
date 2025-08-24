
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
     <div className="flex min-h-screen w-full flex-col bg-background">
       <AppHeader tasks={[]} session={session} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Settings
          </h1>
          <Card>
            <CardHeader>
              <CardTitle>Application Settings</CardTitle>
              <CardDescription>
                This is a placeholder for future application settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                There are no settings to configure at this time.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
