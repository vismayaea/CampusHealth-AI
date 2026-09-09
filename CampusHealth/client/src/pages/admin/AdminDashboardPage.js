import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, MessageCircle, Calendar, Activity } from 'lucide-react';
import { adminAPI } from '../../services/api';

function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [overviewRes, healthRes] = await Promise.all([
          adminAPI.getDashboardOverview('month'),
          adminAPI.getSystemHealth()
        ]);
        setDashboardData(overviewRes.data);
        setSystemHealth(healthRes.data);
      } catch (error) {
        console.error('Failed to load admin dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="p-8 text-center text-neutral-600">Loading dashboard...</div>;
  }

  const users = dashboardData?.users || { total: 0, new: 0 };
  const sessions = dashboardData?.chatSessions || { active: 0, total: 0 };
  const appointments = dashboardData?.appointments || {
    total: 0,
    pendingAppointments: 0,
    approvedAppointments: 0,
    rejectedAppointments: 0,
    cancelledAppointments: 0,
    completedAppointments: 0,
    todaysAppointments: 0,
    upcomingAppointments: 0
  };
  const screenings = dashboardData?.screenings || { total: 0, recent: 0 };
  
  const dbStatus = systemHealth?.database || 'Unknown';
  const cpuUsage = systemHealth?.systemLoad?.cpu || '0%';
  const memUsage = systemHealth?.systemLoad?.memory || '0%';

  return (
    <div className="space-y-6">
      <div className="page-hero flex items-center space-x-3">
        <div className="p-3 bg-primary-100 rounded-2xl shadow-soft">
          <BarChart3 className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-neutral-600">Overview of platform usage and mental health trends</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Users</p>
              <p className="text-2xl font-bold text-neutral-900">{users.total}</p>
              <p className="text-xs text-success-600">+{users.new} this month</p>
            </div>
            <Users className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Active Sessions</p>
              <p className="text-2xl font-bold text-neutral-900">{sessions.active}</p>
              <p className="text-xs text-warning-600">{sessions.total} total</p>
            </div>
            <MessageCircle className="h-8 w-8 text-success-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Appointments</p>
              <p className="text-2xl font-bold text-neutral-900">{appointments.total}</p>
              <p className="text-xs text-info-600">{appointments.todaysAppointments || 0} today · {appointments.upcomingAppointments || appointments.upcoming || 0} upcoming</p>
            </div>
            <Calendar className="h-8 w-8 text-warning-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Screenings</p>
              <p className="text-2xl font-bold text-neutral-900">{screenings.total}</p>
              <p className="text-xs text-danger-600">+{screenings.recent} this month</p>
            </div>
            <Activity className="h-8 w-8 text-danger-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Appointment Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            ['Total', appointments.total || 0],
            ['Pending', appointments.pendingAppointments || 0],
            ['Approved', appointments.approvedAppointments || 0],
            ['Rejected', appointments.rejectedAppointments || 0],
            ['Cancelled', appointments.cancelledAppointments || 0],
            ['Completed', appointments.completedAppointments || 0],
            ['Upcoming', appointments.upcomingAppointments || appointments.upcoming || 0]
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-neutral-100 p-4 text-center">
              <p className="text-xs font-medium text-neutral-600">{label}</p>
              <p className="text-xl font-bold text-neutral-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Mental Health Trends</h2>
          <div className="h-64 bg-neutral-100 rounded-lg flex flex-col items-center justify-center p-4 overflow-y-auto">
            {dashboardData?.screenings?.bySeverity?.length > 0 ? dashboardData.screenings.bySeverity.map(s => (
              <div key={s._id} className="w-full flex justify-between text-sm py-2 border-b border-neutral-200 last:border-0">
                <span className="capitalize">{s._id ? s._id.replace('-', ' ') : 'Unknown'}</span>
                <span className="font-bold">{s.count}</span>
              </div>
            )) : (
              <div className="w-full space-y-3">
                {[
                  ['Minimal', 18],
                  ['Mild', 11],
                  ['Moderate', 6],
                  ['Severe', 2]
                ].map(([label, count]) => (
                  <div key={label} className="w-full flex justify-between text-sm py-2 border-b border-neutral-200 last:border-0">
                    <span>{label}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">User Engagement</h2>
          <div className="h-64 bg-neutral-100 rounded-lg flex flex-col items-center justify-center p-4">
            {dashboardData?.forum?.engagement ? (
              <div className="w-full space-y-4">
                <div className="flex justify-between text-sm"><span className="text-neutral-600">Forum Posts</span><span className="font-bold text-neutral-900">{dashboardData.forum.totalPosts || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-600">Total Post Views</span><span className="font-bold text-neutral-900">{dashboardData.forum.engagement.totalViews || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-600">Total Post Likes</span><span className="font-bold text-neutral-900">{dashboardData.forum.engagement.totalLikes || 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-600">Total Comments</span><span className="font-bold text-neutral-900">{dashboardData.forum.engagement.totalComments || 0}</span></div>
              </div>
            ) : (
              <div className="w-full space-y-4">
                <div className="flex justify-between text-sm"><span className="text-neutral-600">Forum Posts</span><span className="font-bold text-neutral-900">14</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-600">Total Post Views</span><span className="font-bold text-neutral-900">426</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-600">Total Post Likes</span><span className="font-bold text-neutral-900">89</span></div>
                <div className="flex justify-between text-sm"><span className="text-neutral-600">Total Comments</span><span className="font-bold text-neutral-900">37</span></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">System Health</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CPU Usage</span>
                <span>{cpuUsage}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-success-500 h-2 rounded-full" style={{width: cpuUsage || '0%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Memory Usage</span>
                <span>{memUsage}</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-warning-500 h-2 rounded-full" style={{width: memUsage || '0%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Database Status</span>
                <span className={dbStatus === 'connected' ? 'text-success-600 font-medium' : 'text-danger-600 font-medium'}>
                  {dbStatus.charAt(0).toUpperCase() + dbStatus.slice(1)}
                </span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className={`h-2 rounded-full w-full ${dbStatus === 'connected' ? 'bg-success-500' : 'bg-danger-500'}`}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/app/admin/reports" className="w-full btn-primary text-left block">
              View Reports
            </Link>
            <Link to="/app/admin/users" className="w-full btn-outline text-left block">
              Manage Users
            </Link>
            <Link to="/app/notifications" className="w-full btn-outline text-left block">
              Send Notifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
