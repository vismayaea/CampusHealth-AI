import React, { useState, useEffect } from 'react';
import { BarChart3, Users, MessageCircle, Calendar, Activity } from 'lucide-react';
import { adminAPI } from '../../services/api';

function AdminAnalyticsPage() {
  const [userStats, setUserStats] = useState(null);
  const [mentalHealthStats, setMentalHealthStats] = useState(null);
  const [engagementStats, setEngagementStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [usersRes, mhRes, engRes] = await Promise.all([
          adminAPI.getUserAnalytics('month', 'day'),
          adminAPI.getMentalHealthAnalytics('month'),
          adminAPI.getEngagementAnalytics('month')
        ]);
        setUserStats(usersRes.data);
        setMentalHealthStats(mhRes.data);
        setEngagementStats(engRes.data);
      } catch (error) {
        console.error('Failed to load analytics', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  const actUsers = userStats?.activity?.activeUsers || 0;
  const totalUsers = userStats?.activity?.totalUsers || 0;
  
  const totalSessions = engagementStats?.chat?.totalSessions || 0;
  const totalScreenings = mentalHealthStats?.severityDistribution?.reduce((acc, s) => acc + s.count, 0) || 0;
  const totalAppointments = engagementStats?.appointments?.totalAppointments || 0;
  
  const depts = userStats?.demographics?.byDepartment || [];
  const langs = userStats?.demographics?.byLanguage || [];
  const severities = mentalHealthStats?.severityDistribution || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-primary-100 rounded-lg">
          <BarChart3 className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Analytics</h1>
          <p className="text-neutral-600">Comprehensive insights and reporting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Users</p>
              <p className="text-2xl font-bold text-neutral-900">{totalUsers}</p>
              <p className="text-xs text-neutral-500">{actUsers} active recently</p>
            </div>
            <Users className="h-8 w-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Total Chat Sessions</p>
              <p className="text-2xl font-bold text-neutral-900">{totalSessions}</p>
              <p className="text-xs text-warning-600">This month</p>
            </div>
            <MessageCircle className="h-8 w-8 text-success-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Appointments</p>
              <p className="text-2xl font-bold text-neutral-900">{totalAppointments}</p>
              <p className="text-xs text-info-600">{engagementStats?.appointments?.completedAppointments || 0} completed · {engagementStats?.appointments?.pendingAppointments || 0} pending</p>
            </div>
            <Calendar className="h-8 w-8 text-warning-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Screenings</p>
              <p className="text-2xl font-bold text-neutral-900">{totalScreenings}</p>
              <p className="text-xs text-danger-600">{mentalHealthStats?.riskIndicators?.highRiskScreenings || 0} high risk</p>
            </div>
            <Activity className="h-8 w-8 text-danger-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Top Departments</h2>
          <div className="space-y-3">
            {depts.length > 0 ? depts.slice(0, 5).map(dep => (
              <div key={dep._id} className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">{dep._id || 'Unknown'}</span>
                <span className="text-sm font-medium text-neutral-900">{dep.count}</span>
              </div>
            )) : <p className="text-sm text-neutral-500">No department data</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Language Distribution</h2>
          <div className="space-y-3">
            {langs.length > 0 ? langs.map(lang => (
              <div key={lang._id} className="flex justify-between items-center">
                <span className="text-sm text-neutral-600 uppercase">{lang._id}</span>
                <span className="text-sm font-medium text-neutral-900">{lang.count} users</span>
              </div>
            )) : <p className="text-sm text-neutral-500">No language data</p>}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Severity Distribution</h2>
          <div className="space-y-3">
            {severities.length > 0 ? severities.map((sev, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm text-neutral-600 capitalize">{sev._id.severity?.replace('-', ' ') || 'Unknown'} ({sev._id.type})</span>
                <span className="text-sm font-medium text-neutral-900">{sev.count}</span>
              </div>
            )) : <p className="text-sm text-neutral-500">No severity data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalyticsPage;
