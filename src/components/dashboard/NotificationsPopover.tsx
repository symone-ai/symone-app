import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, AlertCircle, CheckCircle2, Info, AlertTriangle, X, UserPlus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  team_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export const NotificationsPopover = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const loadUnreadCount = useCallback(async () => {
    try {
      const result = await api.user.getUnreadNotificationCount();
      if (result.success) setUnreadCount(result.count);
    } catch {
      // Silently fail - notifications are non-critical
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const result = await api.user.listNotifications();
      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.notifications.filter(n => !n.read).length);
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [loadUnreadCount]);

  // Load full list when popover opens
  useEffect(() => {
    if (open) loadNotifications();
  }, [open, loadNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.user.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.user.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleDismiss = async (id: string) => {
    try {
      await api.user.dismissNotification(id);
      const removed = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (removed && !removed.read) setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-accent" />;
      case 'team_invite': return <UserPlus className="w-4 h-4 text-primary" />;
      case 'team_join': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'ownership_transfer': return <Crown className="w-4 h-4 text-accent" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-border last:border-0 hover:bg-secondary/50 transition-colors ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => {
                  if (!notification.read) handleMarkRead(notification.id);
                }}
              >
                <div className="flex items-start gap-3">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(notification.id);
                    }}
                    className="p-1 hover:bg-secondary rounded"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
                {notification.action_url && (
                  <Link
                    to={notification.action_url}
                    className="mt-2 text-xs text-primary hover:underline block"
                    onClick={() => setOpen(false)}
                  >
                    View details →
                  </Link>
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
