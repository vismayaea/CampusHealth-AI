import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  MessageCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { activitiesAPI, appointmentsAPI, chatbotAPI, screeningAPI } from '../services/api';

const formatDate = (date) => {
  if (!date) return 'Not available';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (date) => {
  if (!date) return 'Not available';
  return new Date(date).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getProfileName = (user) => (
  user?.name
  || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  || 'Student'
);

const getAssessmentDate = (screening) => screening?.completedAt || screening?.updatedAt || screening?.createdAt;

const getRiskColor = (riskLevel) => {
  switch (riskLevel) {
    case 'severe':
    case 'moderately-severe':
      return 'bg-danger-100 text-danger-700';
    case 'moderate':
      return 'bg-warning-100 text-warning-700';
    case 'mild':
      return 'bg-primary-100 text-primary-700';
    case 'minimal':
      return 'bg-success-100 text-success-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
};

const statusClass = (status) => {
  switch (status) {
    case 'Approved':
    case 'Completed':
      return 'bg-success-100 text-success-700';
    case 'Rejected':
    case 'Cancelled':
      return 'bg-danger-100 text-danger-700';
    default:
      return 'bg-warning-100 text-warning-700';
  }
};

function InfoCard({ title, children, action }) {
  return (
    <div className="card p-6 h-full">
      <div className="flex items-start justify-between gap-4 mb-5">
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="text-center py-8">
      <div className="p-4 bg-neutral-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
        <Icon className="h-8 w-8 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-600 text-sm mb-4">{message}</p>
      {action}
    </div>
  );
}

function Metric({ label, value, helper }) {
  return (
    <div className="rounded-xl bg-neutral-50 p-4">
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
      {helper && <p className="text-xs text-neutral-500 mt-1">{helper}</p>}
    </div>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [recommendedEvents, setRecommendedEvents] = useState([]);
  const [screenings, setScreenings] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const quickActions = [
    {
      title: t('bookAppointment'),
      description: t('bookAppointmentDescription'),
      icon: Calendar,
      href: '/app/appointments',
      color: 'bg-success-500',
      textColor: 'text-white'
    },
    {
      title: t('startAIChat'),
      description: t('startAIChatDescription'),
      icon: MessageCircle,
      href: '/app/chatbot',
      color: 'bg-primary-500',
      textColor: 'text-white'
    },
    {
      title: t('takeAssessment'),
      description: t('takeAssessmentDescription'),
      icon: Heart,
      href: '/app/screening',
      color: 'bg-danger-500',
      textColor: 'text-white'
    },
    {
      title: t('wellnessEvents'),
      description: t('wellnessEventsDescription'),
      icon: Activity,
      href: '/app/activities',
      color: 'bg-secondary-500',
      textColor: 'text-white'
    },
    {
      title: t('viewCounselors'),
      description: t('viewCounselorsDescription'),
      icon: Users,
      href: '/app/counselors',
      color: 'bg-warning-500',
      textColor: 'text-white'
    }
  ];

  const loadDashboardData = async () => {
    const studentId = user?._id || user?.id;
    if (!studentId) return;

    setIsLoading(true);
    setError('');

    const [appointmentsResult, screeningsResult, chatsResult, registeredEventsResult, recommendedEventsResult] = await Promise.allSettled([
      appointmentsAPI.getStudentAppointments(studentId),
      screeningAPI.getHistory({ limit: 10 }),
      chatbotAPI.getSessions(),
      activitiesAPI.getMyActivities(),
      activitiesAPI.getActivities({ status: 'Upcoming', limit: 6 })
    ]);

    if (appointmentsResult.status === 'fulfilled') {
      setAppointments(appointmentsResult.value.data?.appointments || []);
    } else {
      setAppointments([]);
    }

    if (screeningsResult.status === 'fulfilled') {
      setScreenings(screeningsResult.value.data?.screenings || []);
    } else {
      setScreenings([]);
    }

    if (chatsResult.status === 'fulfilled') {
      setChatSessions(chatsResult.value.data?.sessions || []);
    } else {
      setChatSessions([]);
    }

    if (registeredEventsResult.status === 'fulfilled') {
      setRegisteredEvents(registeredEventsResult.value.data?.activities || []);
    } else {
      setRegisteredEvents([]);
    }

    if (recommendedEventsResult.status === 'fulfilled') {
      setRecommendedEvents(recommendedEventsResult.value.data?.activities || []);
    } else {
      setRecommendedEvents([]);
    }

    const failed = [appointmentsResult, screeningsResult, chatsResult, registeredEventsResult, recommendedEventsResult].filter((result) => result.status === 'rejected');
    if (failed.length > 0) {
      setError(t('dashboardLoadError'));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      loadDashboardData();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.id, user?.role]);

  const dashboardData = useMemo(() => {
    const sortedAppointments = [...appointments].sort((a, b) => {
      const aStart = new Date(a.date);
      const bStart = new Date(b.date);
      return aStart - bStart || String(a.time || '').localeCompare(String(b.time || ''));
    });

    const now = new Date();
    const upcomingAppointment = sortedAppointments.find((appointment) => {
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(23, 59, 59, 999);
      return appointmentDate >= now && ['Pending', 'Approved'].includes(appointment.status);
    });

    const latestPhq = screenings.find((screening) => screening.type === 'PHQ-9');
    const latestGad = screenings.find((screening) => screening.type === 'GAD-7');
    const latestAssessment = screenings[0];
    const lastChat = chatSessions[0];
    const registeredEventIds = new Set(registeredEvents.map((event) => event._id));
    const upcomingRegisteredEvents = [...registeredEvents]
      .filter((event) => new Date(event.startDate) >= now && event.status === 'Upcoming')
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 3);
    const recentRegisteredEvents = [...registeredEvents]
      .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
      .slice(0, 3);
    const recommendedWellnessEvents = recommendedEvents
      .filter((event) => !registeredEventIds.has(event._id) && new Date(event.startDate) >= now)
      .slice(0, 3);

    const activities = [
      ...appointments.slice(0, 5).map((appointment) => ({
        id: `appointment-${appointment._id}`,
        title: `${appointment.status || 'Updated'} appointment with ${appointment.counselorId?.name || 'Counselor'}`,
        detail: `${formatDate(appointment.date)}${appointment.time ? ` at ${appointment.time}` : ''}`,
        date: appointment.updatedAt || appointment.createdAt || appointment.date,
        icon: Calendar,
        color: 'text-success-500'
      })),
      ...screenings.slice(0, 5).map((screening) => ({
        id: `screening-${screening._id}`,
        title: `${screening.type} assessment submitted`,
        detail: `${screening.totalScore} score · ${screening.severity || 'risk pending'}`,
        date: getAssessmentDate(screening),
        icon: Heart,
        color: 'text-danger-500'
      })),
      ...chatSessions.slice(0, 5).map((session) => ({
        id: `chat-${session.sessionId}`,
        title: 'AI conversation',
        detail: session.preview || `${session.messageCount || 0} messages`,
        date: session.lastActivity || session.startedAt,
        icon: MessageCircle,
        color: 'text-primary-500'
      })),
      ...recentRegisteredEvents.map((event) => ({
        id: `event-${event._id}`,
        title: `Registered for ${event.title}`,
        detail: `${formatDateTime(event.startDate)} · ${event.venue || event.location || 'Campus venue'}`,
        date: event.updatedAt || event.startDate,
        icon: Activity,
        color: 'text-secondary-500'
      }))
    ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).slice(0, 6);

    return {
      upcomingAppointment,
      latestPhq,
      latestGad,
      latestAssessment,
      lastChat,
      upcomingRegisteredEvents,
      recentRegisteredEvents,
      recommendedWellnessEvents,
      activities
    };
  }, [appointments, screenings, chatSessions, registeredEvents, recommendedEvents]);

  // If user is counselor, route them to counselor dashboard landing
  if (user?.role === 'counselor') {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl bg-gradient-to-r from-success-600 to-primary-700 p-8 text-white shadow-strong">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-3">{t('welcomeCounselor', { name: user?.firstName || t('counselor') })}</h1>
            <p className="text-primary-100 text-lg">{t('counselorIntro')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/app/appointments" className="card-hover p-6 group block">
            <div className="w-14 h-14 bg-success-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Calendar className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">{t('viewAppointments')}</h3>
            <p className="text-sm text-neutral-600 text-center">{t('viewAppointmentsDescription')}</p>
          </Link>

          <Link to="/app/resources" className="card-hover p-6 group block">
            <div className="w-14 h-14 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">{t('shareResources')}</h3>
            <p className="text-sm text-neutral-600 text-center">{t('shareResourcesDescription')}</p>
          </Link>

          <Link to="/app/activities-list" className="card-hover p-6 group block">
            <div className="w-14 h-14 bg-danger-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">{t('activityAnalysis')}</h3>
            <p className="text-sm text-neutral-600 text-center">{t('activityAnalysisDescription')}</p>
          </Link>

          <Link to="/app/forum" className="card-hover p-6 group block">
            <div className="w-14 h-14 bg-secondary-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">{t('community')}</h3>
            <p className="text-sm text-neutral-600 text-center">{t('communityDescription')}</p>
          </Link>
        </div>
      </div>
    );
  }

  // If user is admin, show admin landing shortcut (full admin pages already exist under /app/admin/*)
  if (user?.role === 'admin') {
    return (
      <div className="space-y-8">
        <div className="rounded-3xl bg-gradient-to-r from-primary-700 to-secondary-700 p-8 text-white shadow-strong">
          <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-3">{t('welcomeAdministrator')}</h1>
            <p className="text-primary-100 text-lg">{t('adminIntro')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link to="/app/admin/analytics" className="card-hover p-6 group block">
            <div className="w-14 h-14 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">{t('analytics')}</h3>
            <p className="text-sm text-neutral-600 text-center">{t('viewPlatformUsage')}</p>
          </Link>

          <Link to="/app/admin/users" className="card-hover p-6 group block">
            <div className="w-14 h-14 bg-success-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <Users className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">{t('manageUsers')}</h3>
            <p className="text-sm text-neutral-600 text-center">{t('manageUsersDescription')}</p>
          </Link>

          <Link to="/app/admin/resources" className="card-hover p-6 group block">
            <div className="w-14 h-14 bg-warning-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">{t('resources')}</h3>
            <p className="text-sm text-neutral-600 text-center">{t('curateContent')}</p>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card text-center py-12">
        <RefreshCw className="h-8 w-8 mx-auto mb-4 text-primary-500 animate-spin" />
        <p className="text-neutral-600">{t('loadingDashboard')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="rounded-3xl bg-gradient-to-r from-primary-700 via-primary-600 to-success-600 p-8 text-white shadow-strong">
        <div className="max-w-4xl">
          <h1 className="text-3xl font-bold mb-3">
            {t('welcomeBack', { name: getProfileName(user) })}
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-primary-100 text-sm">
            <p><span className="font-semibold text-white">{t('department')}:</span> {user?.department || t('notAdded')}</p>
            <p><span className="font-semibold text-white">{t('semester')}:</span> {user?.semester || user?.year || user?.yearOfStudy || t('notAdded')}</p>
            <p><span className="font-semibold text-white">{t('studentId')}:</span> {user?.studentId || t('notAdded')}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-4 flex items-start space-x-3 border border-warning-200 bg-warning-50">
          <AlertCircle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-warning-800">{error}</p>
          </div>
          <button type="button" onClick={loadDashboardData} className="text-sm font-medium text-warning-800 hover:text-warning-900">
            {t('retry')}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="w-full">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-6">{t('quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.title} to={action.href} className="card-hover p-6 text-center group block h-full">
                <div className={`w-14 h-14 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`h-7 w-7 ${action.textColor}`} />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-3 text-lg">{action.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <InfoCard title={t('mentalHealthSummary')}>
          {!dashboardData.latestAssessment ? (
            <EmptyState
              icon={Heart}
              title={t('trackWellbeingBaseline')}
              message={t('trackWellbeingMessage')}
              action={<Link to="/app/screening" className="btn-primary inline-flex items-center px-4 py-2 text-sm">{t('takeAssessment')}</Link>}
            />
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Metric label={t('latestPhqScore')} value={dashboardData.latestPhq?.totalScore ?? '—'} helper={dashboardData.latestPhq ? dashboardData.latestPhq.severity : t('pendingPhq')} />
                <Metric label={t('latestGadScore')} value={dashboardData.latestGad?.totalScore ?? '—'} helper={dashboardData.latestGad ? dashboardData.latestGad.severity : t('pendingGad')} />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-neutral-600">{t('riskLevel')}</p>
                  <span className={`inline-flex mt-2 px-3 py-1 rounded-full text-sm font-medium capitalize ${getRiskColor(dashboardData.latestAssessment.severity)}`}>
                    {dashboardData.latestAssessment.severity || t('notAvailable')}
                  </span>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-medium text-neutral-600">{t('lastAssessment')}</p>
                  <p className="text-neutral-900 font-semibold mt-1">{formatDate(getAssessmentDate(dashboardData.latestAssessment))}</p>
                </div>
              </div>
            </div>
          )}
        </InfoCard>

        <InfoCard
          title={t('aiChatSummary')}
          action={<Link to="/app/chatbot" className="text-sm font-medium text-primary-600 hover:text-primary-700">{t('continueChat')}</Link>}
        >
          {chatSessions.length === 0 ? (
            <EmptyState
              icon={MessageCircle}
              title={t('startGuidedCheckin')}
              message={t('startGuidedCheckinMessage')}
              action={<Link to="/app/chatbot" className="btn-primary inline-flex items-center px-4 py-2 text-sm">{t('startAIChat')}</Link>}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Metric label={t('totalConversations')} value={chatSessions.length} helper={t('savedChatSessions')} />
              <Metric label={t('lastChat')} value={formatDateTime(dashboardData.lastChat?.lastActivity || dashboardData.lastChat?.startedAt)} helper={dashboardData.lastChat?.status || t('recentSession')} />
            </div>
          )}
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <InfoCard
          title={t('upcomingWellnessEvents')}
          action={<Link to="/app/activities" className="text-sm font-medium text-primary-600 hover:text-primary-700">{t('browseEvents')}</Link>}
        >
          {dashboardData.upcomingRegisteredEvents.length === 0 ? (
            <EmptyState
              icon={Activity}
              title={t('buildWellnessCalendar')}
              message={t('buildWellnessCalendarMessage')}
              action={<Link to="/app/activities" className="btn-primary inline-flex items-center px-4 py-2 text-sm">{t('exploreEvents')}</Link>}
            />
          ) : (
            <div className="space-y-4">
              {dashboardData.upcomingRegisteredEvents.map((event) => (
                <div key={event._id} className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900">{event.title}</p>
                      <p className="mt-1 text-sm text-neutral-600">{formatDateTime(event.startDate)}</p>
                      <p className="mt-1 text-sm text-neutral-600">{event.venue || event.location}</p>
                    </div>
                    <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700">{event.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </InfoCard>

        <InfoCard
          title={t('recommendedEvents')}
          action={<Link to="/app/activities" className="text-sm font-medium text-primary-600 hover:text-primary-700">{t('viewAll')}</Link>}
        >
          {dashboardData.recommendedWellnessEvents.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title={t('noRecommendations')}
              message={t('noRecommendationsMessage')}
            />
          ) : (
            <div className="space-y-4">
              {dashboardData.recommendedWellnessEvents.map((event) => (
                <Link key={event._id} to="/app/activities" className="block rounded-xl border border-neutral-200 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50">
                  <p className="font-semibold text-neutral-900">{event.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">{event.category} · {formatDate(event.startDate)}</p>
                  <p className="mt-1 text-xs text-neutral-500">{event.speakerName || 'Campus Wellness Team'}</p>
                </Link>
              ))}
            </div>
          )}
        </InfoCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <InfoCard
          title={t('appointmentSummary')}
          action={<Link to="/app/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-700">{t('viewAll')}</Link>}
        >
          {!dashboardData.upcomingAppointment ? (
            <EmptyState
              icon={Calendar}
              title={t('planCounselingSession')}
              message={t('planCounselingSessionMessage')}
              action={<Link to="/app/appointments" className="btn-primary inline-flex items-center px-4 py-2 text-sm">{t('bookAppointment')}</Link>}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{dashboardData.upcomingAppointment.counselorId?.name || t('counselor')}</h3>
                  <p className="text-sm text-neutral-600">{dashboardData.upcomingAppointment.counselorId?.specialization || t('counselingSession')}</p>
                </div>
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusClass(dashboardData.upcomingAppointment.status)}`}>
                  {dashboardData.upcomingAppointment.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Metric label={t('date')} value={formatDate(dashboardData.upcomingAppointment.date)} />
                <Metric label={t('time')} value={dashboardData.upcomingAppointment.time || t('notAvailable')} />
                <Metric
                  label={t('meetingType')}
                  value={dashboardData.upcomingAppointment.meetingType === 'online' ? t('online') : t('inPerson')}
                />
              </div>
              {dashboardData.upcomingAppointment.meetingType === 'online' ? (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-4 text-sm">
                  <p className="text-neutral-700">
                    <span className="font-semibold">{t('meetingId')}:</span> {dashboardData.upcomingAppointment.meetingId}
                  </p>
                  <a
                    href={dashboardData.upcomingAppointment.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center font-medium text-primary-700"
                  >
                    {t('openMeeting')} <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </div>
              ) : dashboardData.upcomingAppointment.meetingType === 'in-person' ? (
                <div className="rounded-lg border border-success-200 bg-success-50 p-4 text-sm text-neutral-700">
                  <p className="font-semibold">{dashboardData.upcomingAppointment.building}</p>
                  <p>{dashboardData.upcomingAppointment.floor} · {dashboardData.upcomingAppointment.roomNumber}</p>
                  <p className="mt-1 flex items-start">
                    <MapPin className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />
                    {dashboardData.upcomingAppointment.location}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </InfoCard>

        <InfoCard title={t('recentActivity')}>
          {dashboardData.activities.length === 0 ? (
            <EmptyState
              icon={Clock}
              title={t('noRecentActivity')}
              message={t('noRecentActivityMessage')}
            />
          ) : (
            <div className="space-y-4">
              {dashboardData.activities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-start space-x-4 py-2">
                    <div className="p-2 rounded-lg bg-neutral-100 flex-shrink-0">
                      <Icon className={`h-4 w-4 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{activity.title}</p>
                      <p className="text-xs text-neutral-500 truncate">{activity.detail}</p>
                    </div>
                    <p className="text-xs text-neutral-400 flex-shrink-0">{formatDate(activity.date)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </InfoCard>
      </div>

      {/* Mental Health Tips */}
      <div className="rounded-3xl border border-success-100 bg-gradient-to-r from-success-50 to-primary-50 p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-6">{t('todaysMentalHealthTip')}</h2>
        <div className="flex items-start space-x-6">
          <div className="p-3 bg-success-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-success-600" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900 mb-2">{t('practiceGratitude')}</h3>
            <p className="text-neutral-600 text-sm">{t('gratitudeTip')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
