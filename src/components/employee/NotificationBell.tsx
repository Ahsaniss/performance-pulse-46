import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

interface NotificationBellProps {
  userId: string;
}

interface Notification {
  id: string;
  type: 'message' | 'task';
  title: string;
  content: string;
  created_at: string;
}

export const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `to_user=eq.${userId}`
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'message',
            title: 'New Message',
            content: payload.new.subject,
            created_at: payload.new.created_at,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.success('New message received!', {
            description: payload.new.subject,
          });
        }
      )
      .subscribe();

    // Subscribe to new tasks
    const tasksChannel = supabase
      .channel('new-tasks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'task',
            title: 'New Task Assigned',
            content: payload.new.title,
            created_at: payload.new.created_at,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.success('New task assigned!', {
            description: payload.new.title,
          });
        }
      )
      .subscribe();

    // Subscribe to broadcast messages
    const broadcastChannel = supabase
      .channel('broadcast-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: 'is_broadcast=eq.true'
        },
        (payload) => {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'message',
            title: 'Broadcast Message',
            content: payload.new.subject,
            created_at: payload.new.created_at,
          };
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.success('New broadcast message!', {
            description: payload.new.subject,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(broadcastChannel);
    };
  }, [userId]);

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearNotifications}>
              Clear all
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <Card key={notification.id} className="m-2 p-3 border-l-4 border-l-primary">
                <div className="flex items-start gap-3">
                  <Bell className="w-4 h-4 mt-1 text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">{notification.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
