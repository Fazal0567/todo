
"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import {
  Plus,
  LogIn,
  User,
  Settings,
  LogOut,
  Share2,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

import { Session, Room, Task, Notification } from "@/lib/types";
import { logout } from "@/lib/auth-actions";
import { AddRoomDialog } from "./add-room-dialog";
import { TaskSummaryDialog } from "./task-summary-dialog";
import { Button } from "../ui/button";
import { NotificationPopover } from "./notification-popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";


export function AppShell({
  children,
  rooms,
  tasks,
  session,
  notifications = [] // Default to an empty array
}: {
  children: React.ReactNode;
  rooms: Room[];
  tasks: Task[];
  session: Session | null;
  notifications?: Notification[]; // Make prop optional
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isAddRoomOpen, setAddRoomOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    // A hard redirect is better to ensure all state is cleared.
    window.location.href = "/login";
  };
  
   const handleShare = () => {
    if (pathname.includes('/rooms/')) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Room Link Copied!",
        description: "Share the link for others to join this room.",
      });
    } else {
       toast({
        variant: "destructive",
        title: "Nothing to Share",
        description: "You must be in a room to share a link.",
      });
    }
  };


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
             <Logo className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">CollabTaskAI</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => router.push('/rooms/new')}
                variant="outline"
              >
                <Plus />
                <span>New Room</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => router.push('/rooms/join')}>
                <LogIn />
                <span>Join Room</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarGroup>
              <SidebarGroupLabel>Your Rooms</SidebarGroupLabel>
              <SidebarMenuSub className="gap-0 p-0 border-none">
                {rooms.map((room) => (
                  <li key={room.id}>
                    <Collapsible>
                      <div className={cn("flex items-center w-full", pathname.includes(`/rooms/${room.id}`) && "bg-sidebar-accent rounded-md")}>
                        <SidebarMenuSubButton
                          href={`/rooms/${room.id}`}
                          isActive={pathname.includes(`/rooms/${room.id}`)}
                          className="flex-1"
                        >
                          {room.name}
                        </SidebarMenuSubButton>
                        {room.members && room.members.length > 0 && (
                           <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mr-1">
                                  <Users className="h-4 w-4" />
                                  <span className="sr-only">Toggle members</span>
                              </Button>
                          </CollapsibleTrigger>
                        )}
                      </div>
                      <CollapsibleContent>
                        <ul className="pl-6 pr-2 py-1 space-y-1 border-l border-sidebar-border ml-3 my-1">
                          {room.members?.map(member => {
                            const displayName = member.displayName || member.email;
                            const firstLetter = displayName ? displayName[0].toUpperCase() : "?";
                            return (
                               <li key={member.id} className="flex items-center gap-2 text-sm text-sidebar-foreground/80">
                                   <Avatar className="h-5 w-5">
                                      <AvatarImage src={member.avatarUrl || `https://placehold.co/100x100.png?text=${firstLetter}`} alt={displayName} />
                                      <AvatarFallback>{firstLetter}</AvatarFallback>
                                  </Avatar>
                                  <span>{displayName}</span>
                               </li>
                            )
                          })}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                ))}
              </SidebarMenuSub>
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
           <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/profile">
                    <User />
                    <span>Profile</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild>
                  <Link href="/settings">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                 <SidebarMenuButton onClick={handleLogout}>
                    <LogOut />
                    <span>Log out</span>
                  </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <main className="lg:ml-[var(--sidebar-width)]">
        <header className="flex h-14 items-center justify-between gap-2 border-b bg-background px-4 lg:px-6">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex-1" />
            <div className="flex items-center space-x-2">
              <NotificationPopover notifications={notifications} />
              {session && tasks.length > 0 && <TaskSummaryDialog tasks={tasks} />}
               <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
            </div>
        </header>
         <div className="p-4 sm:p-6 md:p-8">{children}</div>
      </main>
      <AddRoomDialog isOpen={isAddRoomOpen} onOpenChange={setAddRoomOpen} />
    </SidebarProvider>
  );
}
