
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
            <SidebarTrigger />
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
              <SidebarMenuSub>
                {rooms.map((room) => (
                  <li key={room.id}>
                    <SidebarMenuSubButton
                      href={`/rooms/${room.id}`}
                      isActive={pathname.includes(`/rooms/${room.id}`)}
                    >
                      {room.name}
                    </SidebarMenuSubButton>
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
        <header className="flex h-14 items-center justify-end gap-2 border-b bg-background px-4 lg:px-6">
            <div className="flex flex-1 items-center justify-end space-x-2">
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
