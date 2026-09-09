import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  MapPin,
  RefreshCw,
  User,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentsAPI } from '../../services/api';

const todayKey = () => new Date().toISOString().split('T')[0];

const getDateKey = (date) => {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
};

const formatDate = (date) => {
  if (!date) return 'Date unavailable';
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const getStudentName = (student) => {
  if (!student || typeof student === 'string') return 'Student';
  return student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.email || 'Student';
};

const statusClass = (status) => {
  switch (status) {
    case 'Approved':
      return 'bg-success-100 text-success-700';
    case 'Rejected':
    case 'Cancelled':
      return 'bg-danger-100 text-danger-700';
    case 'Completed':
      return 'bg-primary-100 text-primary-700';
    default:
      return 'bg-warning-100 text-warning-700';
  }
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <p className="text-3xl font-bold text-neutral-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function AppointmentCard({ appointment, onStatusUpdate, isUpdating }) {
  const canApproveOrReject = appointment.status === 'Pending';
  const canComplete = appointment.status === 'Approved';

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{getStudentName(appointment.studentId)}</h3>
            <div className="mt-2 space-y-1 text-sm text-neutral-600">
              <p>
                <span className="font-medium text-neutral-700">Date:</span> {formatDate(appointment.date)}
              </p>
              <p>
                <span className="font-medium text-neutral-700">Time:</span> {appointment.time || 'Time unavailable'}
              </p>
              <p>
                <span className="font-medium text-neutral-700">Meeting type:</span>{' '}
                {appointment.meetingType === 'online' ? 'Online Video Consultation' : 'In-Person Counseling'}
              </p>
              {appointment.meetingType === 'online' ? (
                <div className="rounded-lg bg-primary-50 p-3 space-y-1">
                  <p><span className="font-medium">Meeting ID:</span> {appointment.meetingId}</p>
                  <p><span className="font-medium">Password:</span> {appointment.meetingPassword}</p>
                  <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-medium text-primary-700">
                    Open meeting <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              ) : appointment.meetingType === 'in-person' ? (
                <div className="rounded-lg bg-success-50 p-3">
                  <p className="font-medium">{appointment.building}</p>
                  <p>{appointment.floor} · {appointment.roomNumber}</p>
                  <p className="mt-1 flex items-start"><MapPin className="mr-1 mt-0.5 h-3 w-3 flex-shrink-0" />{appointment.location}</p>
                </div>
              ) : null}
              <p>
                <span className="font-medium text-neutral-700">Notes:</span> {appointment.notes || 'No notes provided'}
              </p>
            </div>
          </div>
        </div>

        <span className={`px-3 py-1 text-xs rounded-full font-medium self-start ${statusClass(appointment.status)}`}>
          {appointment.status}
        </span>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-3">
        {canApproveOrReject && (
          <>
            <button
              type="button"
              onClick={() => onStatusUpdate(appointment._id, 'Approved')}
              disabled={isUpdating}
              className="btn-primary inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approve
            </button>
            <button
              type="button"
              onClick={() => onStatusUpdate(appointment._id, 'Rejected')}
              disabled={isUpdating}
              className="btn-outline inline-flex items-center justify-center text-danger-600 border-danger-200 hover:bg-danger-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </button>
          </>
        )}
        {canComplete && (
          <button
            type="button"
            onClick={() => onStatusUpdate(appointment._id, 'Completed')}
            disabled={isUpdating}
            className="btn-outline inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Clock className="mr-2 h-4 w-4" />
            Complete
          </button>
        )}
      </div>
    </div>
  );
}

function AppointmentSection({ title, appointments, emptyMessage, onStatusUpdate, updatingId }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>
      </div>

      {appointments.length === 0 ? (
        <div className="card text-center py-10">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
          <p className="text-neutral-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment._id}
              appointment={appointment}
              onStatusUpdate={onStatusUpdate}
              isUpdating={updatingId === appointment._id}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CounselorDashboardPage() {
  const { user } = useAuth();
  const [counselor, setCounselor] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      setError('');

      const counselorsResponse = await appointmentsAPI.getCounselors();
      const counselors = counselorsResponse.data?.counselors || [];
      const counselorMatch = counselors.find(
        (item) => String(item.userId?._id || item.userId || '') === String(user?._id || '')
      ) || counselors.find(
        (item) => !item.userId && item.email?.toLowerCase() === user?.email?.toLowerCase()
      );

      if (!counselorMatch) {
        setCounselor(null);
        setAppointments([]);
        setError('No counselor profile is linked to your account.');
        return;
      }

      setCounselor(counselorMatch);
      const appointmentsResponse = await appointmentsAPI.getCounselorAppointments(counselorMatch._id);
      setAppointments(appointmentsResponse.data?.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load counselor dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.email]);

  const categorized = useMemo(() => {
    const today = todayKey();
    const activeAppointments = appointments.filter((appointment) => !['Rejected', 'Cancelled', 'Completed'].includes(appointment.status));

    const todaysAppointments = activeAppointments.filter((appointment) => getDateKey(appointment.date) === today);
    const pendingRequests = activeAppointments.filter((appointment) => appointment.status === 'Pending');
    const upcomingAppointments = activeAppointments.filter((appointment) => getDateKey(appointment.date) > today);
    const completedSessions = appointments.filter((appointment) => appointment.status === 'Completed');

    return {
      todaysAppointments,
      pendingRequests,
      upcomingAppointments,
      completedSessions
    };
  }, [appointments]);

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      setUpdatingId(appointmentId);
      const response = await appointmentsAPI.updateAppointmentStatus(appointmentId, { status });
      const updatedAppointment = response.data?.appointment;
      setAppointments((current) => current.map((appointment) => (
        appointment._id === appointmentId ? updatedAppointment : appointment
      )));
      toast.success(`Appointment marked as ${status}.`);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update appointment status.';
      toast.error(message);
    } finally {
      setUpdatingId('');
    }
  };

  if (isLoading) {
    return (
      <div className="card text-center py-12">
        <RefreshCw className="h-8 w-8 mx-auto mb-4 text-primary-500 animate-spin" />
        <p className="text-neutral-600">Loading counselor dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="h-14 w-14 mx-auto mb-4 text-danger-500" />
        <h1 className="text-xl font-semibold text-neutral-900 mb-2">Unable to load dashboard</h1>
        <p className="text-neutral-600 mb-6">{error}</p>
        <button type="button" onClick={loadDashboard} className="btn-primary inline-flex items-center">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="page-hero flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-success-100 rounded-2xl shadow-soft">
            <Calendar className="h-8 w-8 text-success-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Counselor Dashboard</h1>
            <p className="text-neutral-600 text-lg">
              {counselor?.name ? `Welcome, ${counselor.name}` : 'Manage appointment requests and sessions'}
            </p>
          </div>
        </div>
        <button type="button" onClick={loadDashboard} className="btn-outline inline-flex items-center">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Today's Appointments" value={categorized.todaysAppointments.length} icon={Calendar} color="bg-success-500" />
        <StatCard title="Pending Requests" value={categorized.pendingRequests.length} icon={Clock} color="bg-warning-500" />
        <StatCard title="Completed Sessions" value={categorized.completedSessions.length} icon={CheckCircle} color="bg-primary-500" />
        <StatCard title="Upcoming Sessions" value={categorized.upcomingAppointments.length} icon={User} color="bg-secondary-500" />
      </div>

      <AppointmentSection
        title="Today's Appointments"
        appointments={categorized.todaysAppointments}
        emptyMessage="No appointments scheduled for today."
        onStatusUpdate={handleStatusUpdate}
        updatingId={updatingId}
      />

      <AppointmentSection
        title="Upcoming Appointments"
        appointments={categorized.upcomingAppointments}
        emptyMessage="Upcoming appointments will appear here once students book approved sessions."
        onStatusUpdate={handleStatusUpdate}
        updatingId={updatingId}
      />

      <AppointmentSection
        title="Pending Requests"
        appointments={categorized.pendingRequests}
        emptyMessage="No pending requests."
        onStatusUpdate={handleStatusUpdate}
        updatingId={updatingId}
      />
    </div>
  );
}

export default CounselorDashboardPage;
