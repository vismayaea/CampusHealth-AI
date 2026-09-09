import React, { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCheck, Loader2, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const labels = {
  appointment_booked: 'Appointment',
  appointment_approved: 'Appointment',
  appointment_rejected: 'Appointment',
  appointment_cancelled: 'Appointment',
  appointment_completed: 'Appointment',
  activity_registration_confirmed: 'Activity',
  activity_registration_cancelled: 'Activity',
  activity_capacity_full: 'Activity',
  activity_updated: 'Activity',
  activity_reminder: 'Activity',
  forum_reply_received: 'Forum',
  forum_post_liked: 'Forum',
  forum_post_reported: 'Forum',
  forum_post_moderated: 'Forum',
  assessment_reminder: 'Assessment',
  assessment_completed: 'Assessment',
  assessment_high_risk: 'Assessment',
  assessment_result_available: 'Assessment',
  admin_broadcast: 'Announcement'
};

const errorMessage = error => error.response?.data?.message || 'Unable to complete the request';

function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: '', message: '' });
  const [sending, setSending] = useState(false);

  const notifyBell = () => window.dispatchEvent(new Event('notifications-updated'));

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await notificationsAPI.getNotifications({ unreadOnly, limit: 50 });
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const markOne = async notification => {
    if (notification.read) return;
    try {
      await notificationsAPI.markAsRead(notification._id);
      setNotifications(current => unreadOnly
        ? current.filter(item => item._id !== notification._id)
        : current.map(item => item._id === notification._id ? { ...item, read: true } : item));
      setUnreadCount(current => Math.max(0, current - 1));
      notifyBell();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    }
  };

  const markAll = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(current => unreadOnly ? [] : current.map(item => ({ ...item, read: true })));
      setUnreadCount(0);
      notifyBell();
      toast.success('All notifications marked as read');
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    }
  };

  const sendBroadcast = async event => {
    event.preventDefault();
    try {
      setSending(true);
      const response = await notificationsAPI.broadcast(broadcast);
      toast.success(`Announcement sent to ${response.data.recipientCount} users`);
      setBroadcast({ title: '', message: '' });
      await loadNotifications();
      notifyBell();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="page-hero flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary-100 rounded-2xl shadow-soft"><Bell className="h-6 w-6 text-primary-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
            <p className="text-neutral-600">{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</p>
          </div>
        </div>
        <button disabled={unreadCount === 0} onClick={markAll} className="btn-outline inline-flex items-center justify-center disabled:opacity-50">
          <CheckCheck className="h-4 w-4 mr-2" /> Mark all as read
        </button>
      </div>

      {user?.role === 'admin' && (
        <form onSubmit={sendBroadcast} className="card space-y-4">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary-600" />
            <h2 className="font-semibold text-neutral-900">Broadcast announcement</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <input
              required minLength={3} maxLength={150}
              className="form-input"
              placeholder="Announcement title"
              value={broadcast.title}
              onChange={event => setBroadcast({ ...broadcast, title: event.target.value })}
            />
            <textarea
              required minLength={3} maxLength={1000}
              className="form-input lg:col-span-2 min-h-24"
              placeholder="Message for all active users"
              value={broadcast.message}
              onChange={event => setBroadcast({ ...broadcast, message: event.target.value })}
            />
          </div>
          <button disabled={sending} className="btn-primary">
            {sending ? 'Sending...' : 'Send announcement'}
          </button>
        </form>
      )}

      <div className="flex gap-2">
        <button onClick={() => setUnreadOnly(false)} className={unreadOnly ? 'btn-outline' : 'btn-primary'}>All</button>
        <button onClick={() => setUnreadOnly(true)} className={unreadOnly ? 'btn-primary' : 'btn-outline'}>Unread</button>
      </div>

      {loading ? (
        <div className="card py-16 flex justify-center text-neutral-500"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading notifications...</div>
      ) : error ? (
        <div className="card py-12 text-center">
          <p className="text-danger-600 mb-4">{error}</p>
          <button className="btn-outline" onClick={loadNotifications}>Try again</button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card py-16 text-center">
          <Bell className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500">
            {unreadOnly ? 'All caught up — new priority updates will appear here.' : 'Campus wellness updates, appointments, and reminders will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notification => (
            <button
              key={notification._id}
              onClick={() => markOne(notification)}
              className={`card w-full text-left transition-colors hover:border-primary-200 ${notification.read ? 'bg-white' : 'bg-primary-50 border-primary-100'}`}
            >
              <div className="flex gap-3">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full flex-shrink-0 ${notification.read ? 'bg-neutral-300' : 'bg-primary-600'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-neutral-900">{notification.title}</h2>
                      <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded-full">{labels[notification.type] || 'Update'}</span>
                    </div>
                    <time className="text-xs text-neutral-500 flex-shrink-0">{new Date(notification.createdAt).toLocaleString()}</time>
                  </div>
                  <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap break-words">{notification.message}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
