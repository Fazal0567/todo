
"use client";

import { useState, useTransition, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { getSession } from "@/lib/auth-actions-client";
import {
  updateUserAccount,
  updateUserProfile,
  updateNotificationPreferences,
  getUserById,
} from "@/lib/user-actions-client";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app/header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";
import type { Session, User } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

const accountFormSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().optional(),
})
.refine(data => data.email || data.password, {
  message: "Email or password must be provided.",
  path: ["email"],
});

const profileFormSchema = z.object({
  displayName: z.string().min(1, "Display name is required."),
  avatarUrl: z.string().optional(),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const avatarFileRef = useRef<HTMLInputElement>(null);

  const accountForm = useForm<z.infer<typeof accountFormSchema>>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: "", avatarUrl: "" },
  });

  React.useEffect(() => {
    async function loadData() {
      const sessionData = await getSession();
      setSession(sessionData);
      if (sessionData?.userId) {
        const userData = await getUserById(sessionData.userId);
        setUser(userData);
        accountForm.reset({ email: userData?.email || "" });
        profileForm.reset({
          displayName: userData?.displayName || "",
          avatarUrl: userData?.avatarUrl || "",
        });
      }
    }
    loadData();
  }, [accountForm, profileForm]);

  const handleAccountUpdate = (values: z.infer<typeof accountFormSchema>) => {
    if (!session?.userId) return;
    startTransition(async () => {
      const result = await updateUserAccount(session.userId, values);
      if (result.success) {
        toast({ title: "Success", description: result.message });
        const newSession = await getSession(); // re-fetch session
        setSession(newSession);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  const handleProfileUpdate = (values: z.infer<typeof profileFormSchema>) => {
    if (!session?.userId) return;
    startTransition(async () => {
      const result = await updateUserProfile(session.userId, values);
      if (result.success) {
        toast({ title: "Success", description: result.message });
        const newSession = await getSession(); // re-fetch session
        setSession(newSession);
        // Refresh the page to show new avatar in header
        router.refresh();
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  };

  const handleNotificationsUpdate = (enabled: boolean) => {
     if (!session?.userId) return;
     startTransition(async () => {
      const result = await updateNotificationPreferences(session.userId, enabled);
      if (result.success) {
        toast({ title: "Success", description: result.message });
        setUser(prev => prev ? {...prev, emailNotifications: enabled} : null);
      } else {
        toast({ variant: "destructive", title: "Error", description: result.error });
      }
    });
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        profileForm.setValue('avatarUrl', reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };


  if (!session || !user) {
    return (
       <div className="flex min-h-screen w-full flex-col bg-background">
        <AppHeader tasks={[]} session={session} />
         <main className="flex-1 p-4 sm:p-6 md:p-8">
           <div className="mx-auto max-w-4xl space-y-8">
              <Skeleton className="h-10 w-1/3" />
              <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-24" /></CardContent>
              </Card>
               <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="flex items-center space-x-4"><Skeleton className="h-16 w-16 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-24" /></div></CardContent>
              </Card>
               <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="flex items-center justify-between"><div className="w-1/2"><Skeleton className="h-5 w-1/3" /></div><Skeleton className="h-6 w-11" /></CardContent>
              </Card>
           </div>
         </main>
       </div>
    );
  }

  const displayName = user.displayName || user.email;
  const firstLetter = displayName ? displayName[0].toUpperCase() : "?";

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AppHeader tasks={[]} session={session} />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
            Settings
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your email or password. Changes will require you to log in again.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...accountForm}>
                <form onSubmit={accountForm.handleSubmit(handleAccountUpdate)} className="space-y-4">
                  <FormField control={accountForm.control} name="email" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl><Input type="email" {...field} disabled={isPending} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={accountForm.control} name="password" render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password (optional)</FormLabel>
                        <FormControl><Input type="password" placeholder="Leave blank to keep current password" {...field} disabled={isPending} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Account Changes'}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your avatar and display name.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                   <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={profileForm.watch('avatarUrl') || user.avatarUrl || `https://placehold.co/100x100.png?text=${firstLetter}`} alt={user.displayName} data-ai-hint="avatar" />
                      <AvatarFallback>{firstLetter}</AvatarFallback>
                    </Avatar>
                     <div className="flex-1">
                        <Label htmlFor="avatar-upload">Profile Picture</Label>
                        <div className="flex items-center gap-2">
                           <Input id="avatar-upload" type="file" accept="image/*" className="hidden" ref={avatarFileRef} onChange={handleAvatarChange} />
                            <Button type="button" variant="outline" onClick={() => avatarFileRef.current?.click()} disabled={isPending}>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                            </Button>
                            {profileForm.watch('avatarUrl') && <p className="text-xs text-muted-foreground">Image ready to upload.</p>}
                        </div>
                     </div>
                  </div>
                   <FormField control={profileForm.control} name="displayName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl><Input {...field} disabled={isPending} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPending}>{isPending ? 'Updating...' : 'Update Profile'}</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about tasks and rooms.</p>
              </div>
              <Switch
                checked={!!user.emailNotifications}
                onCheckedChange={handleNotificationsUpdate}
                disabled={isPending}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
