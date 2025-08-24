
"use client";

import React, { useTransition } from 'react';
import { Bell, Mail } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Notification } from "@/lib/types";
import { acceptInvite, declineInvite, markNotificationsAsRead } from '@/lib/notification-actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth-actions-client';

export function NotificationPopover({ notifications }: { notifications: Notification[] }) {
    const unreadCount = notifications.filter(n => !n.read).length;
    const { toast } = useToast();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleMarkAsRead = async () => {
        const session = await getSession();
        if (session && unreadCount > 0) {
            startTransition(async () => {
                await markNotificationsAsRead(session.userId);
                router.refresh();
            });
        }
    };
    
    const handleAccept = (id: string) => {
        startTransition(async () => {
            const result = await acceptInvite(id);
            if (result.success) {
                toast({ title: 'Invitation Accepted!', description: 'You have joined the room.' });
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    const handleDecline = (id: string) => {
         startTransition(async () => {
            const result = await declineInvite(id);
            if (result.success) {
                toast({ title: 'Invitation Declined' });
                router.refresh();
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.error });
            }
        });
    };

    return (
        <Popover onOpenChange={(open) => { if (open) { handleMarkAsRead() }}}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary" />
                    )}
                    <span className="sr-only">Open notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4">
                    <h3 className="text-lg font-medium">Notifications</h3>
                </div>
                <Separator />
                <ScrollArea className="h-96">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            You have no new notifications.
                        </div>
                    ) : (
                        <div className="p-2">
                           {notifications.map(n => (
                               <div key={n.id} className="p-2 rounded-md hover:bg-accent">
                                   <div className="text-sm mb-2">
                                       <span className="font-semibold">{n.data.inviterName}</span> invited you to join the room <span className="font-semibold">{n.data.roomName}</span>.
                                   </div>
                                   <div className="flex justify-end gap-2">
                                       <Button size="sm" variant="outline" onClick={() => handleDecline(n.id)} disabled={isPending}>
                                           Decline
                                       </Button>
                                       <Button size="sm" onClick={() => handleAccept(n.id)} disabled={isPending}>
                                           Accept
                                       </Button>
                                   </div>
                               </div>
                           ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
