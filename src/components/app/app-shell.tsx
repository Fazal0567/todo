
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
  Box,
  Plus,
  Home,
  Settings,
  User,
  LogOut,
  Share2,
  LifeBuoy,
  LogIn,
} from "lucide-react";
import { AppHeader } from "./header";
import { getSession } from "@/lib/auth-actions-client";
import { Session, Room, Task } from "@/lib/types";
import { useParams, usePathname, useRouter } from "next/navigation";
import { AddRoomDialog } from "./add-room-dialog";
import { Skeleton } from "../ui/skeleton";
import { logout } from "@/lib/auth-actions";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { TaskSummaryDialog } from "./task-summary-dialog";
import { Button } from "../ui/button";

export function AppShell({
  children,
  rooms,
  tasks,
  session,
}: {
  children: React.ReactNode;
  rooms: Room[];
  tasks: Task[];
  session: Session | null;
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
    router.push("/login");
    router.refresh();
  };
  
   const handleShare = () => {
    if (pathname.includes('/rooms/')) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Room Link Copied!",
        description: "Share the link to invite others to this room.",
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
