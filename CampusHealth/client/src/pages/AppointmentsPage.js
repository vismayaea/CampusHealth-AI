import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  MapPin,
  RefreshCw,
  User,
  Users
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsAPI } from '../services/api';

const todayString = () => new Date().toISOString().split('T')[0];

const formatTime = (time) => {
  if (!time) return 'Time unavailable';
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDateTime = (appointment) => {
  const dateValue = appointment.date ? new Date(appointment.date) : null;
  const dateLabel = dateValue && !Number.isNaN(dateValue.getTime())
    ? dateValue.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Date unavailable';
  return `${dateLabel}${appointment.time ? ` at ${formatTime(appointment.time)}` : ''}`;
};

const getCounselorName = (counselor) => {
  if (!counselor) return 'Counselor';
  if (typeof counselor === 'string') return 'Counselor';
  return counselor.name || `${counselor.firstName || ''} ${counselor.lastName || ''}`.trim() || 'Counselor';
};

function AppointmentsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const activeTab = ['history', 'confirmation'].includes(requestedTab) ? requestedTab : 'book';
  const requestedCounselorId = searchParams.get('counselorId');
  const confirmationId = searchParams.get('appointmentId');
  const studentId = user?._id || user?.id;
  const bookingFormRef = useRef(null);

  const [counselors, setCounselors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [meetingType, setMeetingType] = useState('online');
  const [notes, setNotes] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [confirmedAppointment, setConfirmedAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [selectionError, setSelectionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedCounselor = useMemo(
    () => counselors.find((counselor) => counselor._id === selectedCounselorId),
    [counselors, selectedCounselorId]
  );

  const loadData = async () => {
    if (!studentId) {
      setIsLoading(false);
      setError('Unable to identify the logged-in student. Please sign in again.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const [counselorsResponse, appointmentsResponse] = await Promise.all([
        appointmentsAPI.getCounselors(),
        appointmentsAPI.getStudentAppointments(studentId)
      ]);

      setCounselors(counselorsResponse.data?.counselors || []);
      setAppointments(appointmentsResponse.data?.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointment data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    setSelectedTime('');
  }, [selectedCounselorId, selectedDate]);

  useEffect(() => {
    if (!selectedCounselorId || !selectedDate) {
      setTimeSlots([]);
      setSlotsError('');
      return undefined;
    }

    let cancelled = false;
    const loadAvailability = async () => {
      try {
        setIsSlotsLoading(true);
        setSlotsError('');
        const response = await appointmentsAPI.getAvailability({
          counselorId: selectedCounselorId,
          date: selectedDate
        });
        if (!cancelled) setTimeSlots(response.data?.slots || []);
      } catch (err) {
        if (!cancelled) {
          setTimeSlots([]);
          setSlotsError(err.response?.data?.message || 'Unable to load available times.');
        }
      } finally {
        if (!cancelled) setIsSlotsLoading(false);
      }
    };

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [selectedCounselorId, selectedDate]);

  useEffect(() => {
    if (activeTab !== 'confirmation' || !confirmationId) return;
    const persisted = appointments.find((appointment) => appointment._id === confirmationId);
    if (persisted) setConfirmedAppointment(persisted);
  }, [activeTab, appointments, confirmationId]);

  useEffect(() => {
    if (isLoading || activeTab !== 'book' || !requestedCounselorId) return;

    const counselorExists = counselors.some(
      (counselor) => String(counselor._id) === String(requestedCounselorId)
    );
    if (counselorExists) {
      setSelectedCounselorId(requestedCounselorId);
      setSelectionError('');
    } else {
      setSelectedCounselorId('');
      setSelectionError('The selected counselor could not be found. Please choose another counselor.');
    }

    window.requestAnimationFrame(() => {
      bookingFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [activeTab, counselors, isLoading, requestedCounselorId]);

  const validateForm = () => {
    if (!studentId) return 'Student account is not loaded. Please sign in again.';
    if (!selectedCounselorId) return 'Please select a counselor.';
    if (!selectedDate) return 'Please select a date.';
    if (selectedDate < todayString()) return 'Please select a future date.';
    if (!selectedTime) return 'Please select an available time.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');
    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError('');
      const response = await appointmentsAPI.createAppointment({
        studentId,
        counselorId: selectedCounselorId,
        date: selectedDate,
        time: selectedTime,
        meetingType,
        notes: notes.trim()
      });

      const message = response.data?.message || 'Appointment booked successfully.';
      const createdAppointment = response.data?.appointment;
      setSuccessMessage(message);
      toast.success(message);
      setSelectedCounselorId('');
      setSelectedDate('');
      setSelectedTime('');
      setMeetingType('online');
      setNotes('');
      await loadData();
      setConfirmedAppointment(createdAppointment);
      setSearchParams({ tab: 'confirmation', appointmentId: createdAppointment._id });
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to book appointment.';
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingAppointments = appointments.filter((appointment) => !['Cancelled', 'Completed', 'Rejected'].includes(appointment.status));
  const pastAppointments = appointments.filter((appointment) => ['Cancelled', 'Completed', 'Rejected'].includes(appointment.status));

  return (
    <div className="space-y-8">
      <div className="page-hero flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-success-100 rounded-2xl shadow-soft">
            <Calendar className="h-8 w-8 text-success-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Appointments</h1>
            <p className="text-neutral-600 text-lg">Book and track your counseling appointments</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'book' })}
          className={`px-5 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'book'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Book Appointment
        </button>
        <button
          type="button"
          onClick={() => setSearchParams({ tab: 'history' })}
          className={`px-5 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          Appointment History
        </button>
      </div>

      {isLoading ? (
        <div className="card text-center py-12">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 text-primary-500 animate-spin" />
          <p className="text-neutral-600">Loading appointment data...</p>
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <AlertCircle className="h-14 w-14 mx-auto mb-4 text-danger-500" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Unable to load appointments</h3>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button type="button" onClick={loadData} className="btn-primary inline-flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </button>
        </div>
      ) : activeTab === 'book' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <form ref={bookingFormRef} onSubmit={handleSubmit} className="xl:col-span-2 card space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Book a session</h2>
              <p className="text-neutral-600">Choose a counselor, future date, and available time slot.</p>
            </div>

            {successMessage && (
              <div className="bg-success-50 border border-success-200 text-success-700 rounded-lg p-4 flex items-start">
                <CheckCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <p>{successMessage}</p>
              </div>
            )}

            {formError && (
              <div className="bg-danger-50 border border-danger-200 text-danger-700 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <p>{formError}</p>
              </div>
            )}

            {selectionError && (
              <div className="bg-warning-50 border border-warning-200 text-warning-700 rounded-lg p-4 flex items-start">
                <AlertCircle className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                <p>{selectionError}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Counselor</label>
              <select
                className="form-select w-full"
                value={selectedCounselorId}
                onChange={(event) => setSelectedCounselorId(event.target.value)}
                disabled={isSubmitting}
              >
                <option value="">Select a counselor</option>
                {counselors.map((counselor) => (
                  <option key={counselor._id} value={counselor._id}>
                    {counselor.name} — {counselor.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Date</label>
                <input
                  type="date"
                  min={todayString()}
                  className="form-input w-full"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Available time</label>
                <select
                  className="form-select w-full"
                  value={selectedTime}
                  onChange={(event) => setSelectedTime(event.target.value)}
                  disabled={!selectedCounselorId || !selectedDate || isSubmitting}
                >
                  <option value="">
                    {!selectedCounselorId || !selectedDate
                      ? 'Select counselor and date first'
                      : isSlotsLoading
                        ? 'Loading available times...'
                        : 'Select a time'}
                  </option>
                  {timeSlots.map((slot) => (
                    <option key={slot.value} value={slot.value} disabled={slot.booked}>
                      {formatTime(slot.value)}{slot.booked ? ' — Booked' : ''}
                    </option>
                  ))}
                </select>
                {slotsError && <p className="mt-2 text-sm text-danger-600">{slotsError}</p>}
                {!isSlotsLoading && selectedCounselorId && selectedDate && !slotsError && timeSlots.length === 0 && (
                  <p className="mt-2 text-sm text-neutral-500">No availability is configured for this date.</p>
                )}
              </div>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-neutral-700 mb-3">Appointment Type</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className={`rounded-xl border p-4 cursor-pointer transition-colors ${meetingType === 'online' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'}`}>
                  <input
                    type="radio"
                    name="meetingType"
                    value="online"
                    checked={meetingType === 'online'}
                    onChange={(event) => setMeetingType(event.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium text-neutral-900">Online Video Consultation</span>
                </label>
                <label className={`rounded-xl border p-4 cursor-pointer transition-colors ${meetingType === 'in-person' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200'}`}>
                  <input
                    type="radio"
                    name="meetingType"
                    value="in-person"
                    checked={meetingType === 'in-person'}
                    onChange={(event) => setMeetingType(event.target.value)}
                    className="mr-3"
                  />
                  <span className="font-medium text-neutral-900">In-Person Counseling</span>
                </label>
              </div>
              <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
                {meetingType === 'online'
                  ? 'A secure meeting ID, password, and CampusHealth Meet link will be generated after booking.'
                  : 'Campus Counseling Center · Second Floor · Room 204 · Student Services Block'}
              </div>
            </fieldset>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Notes optional</label>
              <textarea
                className="form-input w-full"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Anything you would like the counselor to know before the session?"
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full md:w-auto inline-flex items-center justify-center px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Submit Appointment
                </>
              )}
            </button>
          </form>

          <div className="space-y-6">
            <div className="card">
              <h3 className="font-semibold text-neutral-900 mb-4 flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary-600" />
                Selected counselor
              </h3>
              {selectedCounselor ? (
                <div className="space-y-2">
                  <p className="font-medium text-neutral-900">{selectedCounselor.name}</p>
                  <p className="text-sm text-primary-600">{selectedCounselor.specialization}</p>
                  <p className="text-sm text-neutral-600">{selectedCounselor.qualification}</p>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    selectedCounselor.status === 'Available'
                      ? 'bg-success-100 text-success-700'
                      : 'bg-warning-100 text-warning-700'
                  }`}>
                    {selectedCounselor.status}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-neutral-600">Choose a counselor to view their details.</p>
              )}
            </div>

            <div className="card">
              <h3 className="font-semibold text-neutral-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-success-600" />
                Upcoming
              </h3>
              <p className="text-3xl font-bold text-neutral-900">{upcomingAppointments.length}</p>
              <p className="text-sm text-neutral-600">Pending or approved appointments</p>
            </div>
          </div>
        </div>
      ) : activeTab === 'confirmation' && confirmedAppointment ? (
        <div className="card max-w-3xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <div className="rounded-full bg-success-100 p-3">
              <CheckCircle className="h-7 w-7 text-success-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">Appointment Confirmed</h2>
              <p className="text-neutral-600">Your request is saved and awaiting counselor approval.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <p><span className="font-semibold text-neutral-900">Counselor:</span> {getCounselorName(confirmedAppointment.counselorId)}</p>
            <p><span className="font-semibold text-neutral-900">Status:</span> {confirmedAppointment.status}</p>
            <p><span className="font-semibold text-neutral-900">Date and time:</span> {formatDateTime(confirmedAppointment)}</p>
            <p><span className="font-semibold text-neutral-900">Meeting type:</span> {confirmedAppointment.meetingType === 'online' ? 'Online Video Consultation' : 'In-Person Counseling'}</p>
          </div>
          {confirmedAppointment.meetingType === 'online' ? (
            <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-5 space-y-2">
              <p><span className="font-semibold">Meeting ID:</span> {confirmedAppointment.meetingId}</p>
              <p><span className="font-semibold">Meeting password:</span> {confirmedAppointment.meetingPassword}</p>
              <a href={confirmedAppointment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary-700 font-medium inline-flex items-center">
                Open CampusHealth Meet <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-success-200 bg-success-50 p-5 space-y-2">
              <p className="font-semibold text-neutral-900">{confirmedAppointment.building}</p>
              <p>{confirmedAppointment.floor} · {confirmedAppointment.roomNumber}</p>
              <p className="flex items-start"><MapPin className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0" />{confirmedAppointment.location}</p>
            </div>
          )}
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={() => setSearchParams({ tab: 'history' })} className="btn-primary">
              View Appointment History
            </button>
            <button type="button" onClick={() => setSearchParams({ tab: 'book' })} className="btn-outline">
              Book Another Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">Appointment History</h2>
              <p className="text-neutral-600">Review your submitted appointments.</p>
            </div>
            <button type="button" onClick={loadData} className="btn-outline inline-flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>

          {appointments.length === 0 ? (
            <div className="card text-center py-12">
              <FileText className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Your counseling schedule is ready</h3>
              <p className="text-neutral-600 mb-6">Book a session and your appointment details, status, and meeting information will appear here.</p>
              <button type="button" onClick={() => setSearchParams({ tab: 'book' })} className="btn-primary">
                Book Appointment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...upcomingAppointments, ...pastAppointments].map((appointment) => (
                <div key={appointment._id} className="card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <User className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{getCounselorName(appointment.counselorId)}</h3>
                        <p className="text-sm text-neutral-600">{formatDateTime(appointment)}</p>
                        <p className="mt-2 text-sm font-medium text-neutral-700">
                          {appointment.meetingType === 'online' ? 'Online Video Consultation' : 'In-Person Counseling'}
                        </p>
                        {appointment.meetingType === 'online' ? (
                          appointment.meetingLink && (
                            <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-primary-600 inline-flex items-center">
                              Open meeting <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          )
                        ) : appointment.meetingType === 'in-person' ? (
                          <p className="mt-1 text-sm text-neutral-600">
                            {appointment.building} · {appointment.floor} · {appointment.roomNumber}
                          </p>
                        ) : null}
                        {appointment.notes && (
                          <p className="mt-3 text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                      appointment.status === 'Approved'
                        ? 'bg-success-100 text-success-700'
                        : appointment.status === 'Rejected' || appointment.status === 'Cancelled'
                          ? 'bg-danger-100 text-danger-700'
                          : appointment.status === 'Completed'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-warning-100 text-warning-700'
                    }`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AppointmentsPage;
