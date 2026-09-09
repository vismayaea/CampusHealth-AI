import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Calendar,
  Clock,
  Edit3,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Sparkles,
  Trash2,
  User,
  Users,
  X
} from 'lucide-react';
import { activitiesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const emptyForm = {
  title: '',
  description: '',
  category: 'Mindfulness',
  image: '',
  speakerName: '',
  speakerDesignation: '',
  venue: '',
  location: '',
  mapDescription: '',
  duration: 60,
  agenda: '',
  contactEmail: '',
  contactPhone: '',
  tags: '',
  startDate: '',
  endDate: '',
  capacity: 30,
  status: 'Upcoming'
};

const categories = [
  'Awareness',
  'Burnout',
  'Exam Wellness',
  'Fitness',
  'Mindfulness',
  'Orientation',
  'Relationships',
  'Self Care',
  'Support Group',
  'Workshop',
  'Other'
];
const statuses = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

function formatDate(value) {
  if (!value) return 'Not scheduled';
  return new Date(value).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const listToText = (value) => Array.isArray(value) ? value.join('\n') : '';
const csvToText = (value) => Array.isArray(value) ? value.join(', ') : '';

function EventDetailsModal({ event, onClose, isRegistered, isStudent, canManage, onRegister, onCancel, busyId, registrations, onLoadRegistrations }) {
  if (!event) return null;

  const registeredCount = event.registeredCount ?? event.registeredStudents?.length ?? 0;
  const seatsLeft = Math.max(0, Number(event.capacity || 0) - registeredCount);
  const full = seatsLeft <= 0;
  const past = new Date(event.startDate) <= new Date();
  const rows = registrations[event._id] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="relative h-64 overflow-hidden rounded-t-2xl bg-gradient-to-br from-primary-100 to-secondary-100">
          {event.image ? (
            <img src={event.image} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-primary-600">
              <Activity className="h-16 w-16" />
            </div>
          )}
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-neutral-700 shadow-sm hover:bg-white"
            onClick={onClose}
            aria-label="Close event details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">{event.category}</span>
                <span className="rounded-full bg-success-100 px-3 py-1 text-xs font-semibold text-success-700">{event.status}</span>
              </div>
              <h2 className="mt-4 text-3xl font-bold text-neutral-900">{event.title}</h2>
              <p className="mt-3 text-neutral-600">{event.description}</p>
            </div>

            <div className="rounded-xl border border-neutral-200 p-5">
              <h3 className="mb-3 text-lg font-semibold text-neutral-900">About this event</h3>
              <div className="grid gap-4 text-sm text-neutral-700 sm:grid-cols-2">
                <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary-600" /> {formatDate(event.startDate)}</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary-600" /> {formatTime(event.startDate)} • {event.duration || 60} mins</p>
                <p className="flex items-center gap-2"><Users className="h-4 w-4 text-primary-600" /> {registeredCount} / {event.capacity} registered</p>
                <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary-600" /> {event.venue || event.location}</p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-5">
              <h3 className="mb-3 text-lg font-semibold text-neutral-900">Speaker</h3>
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-primary-100 p-3">
                  <User className="h-6 w-6 text-primary-700" />
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{event.speakerName || 'Campus Wellness Team'}</p>
                  <p className="text-sm text-neutral-600">{event.speakerDesignation || 'Wellness facilitator'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-5">
              <h3 className="mb-3 text-lg font-semibold text-neutral-900">Agenda</h3>
              {event.agenda?.length ? (
                <ol className="space-y-3">
                  {event.agenda.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex gap-3 text-sm text-neutral-700">
                      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">{index + 1}</span>
                      {item}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-neutral-600">Agenda will be shared by the organizer.</p>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-primary-100 bg-primary-50 p-5">
              <p className="text-sm font-medium text-primary-700">Seats available</p>
              <p className="mt-1 text-3xl font-bold text-neutral-900">{seatsLeft}</p>
              <div className="mt-4 h-2 rounded-full bg-white">
                <div
                  className="h-2 rounded-full bg-primary-600"
                  style={{ width: `${Math.min(100, (registeredCount / Math.max(1, event.capacity)) * 100)}%` }}
                />
              </div>
              {isStudent && (
                isRegistered ? (
                  <button type="button" className="btn-outline mt-5 w-full" disabled={busyId === event._id} onClick={() => onCancel(event._id)}>
                    Cancel registration
                  </button>
                ) : (
                  <button type="button" className="btn-primary mt-5 w-full" disabled={busyId === event._id || full || past || event.status !== 'Upcoming'} onClick={() => onRegister(event._id)}>
                    {full ? 'Event full' : past ? 'Registration closed' : 'Register for event'}
                  </button>
                )
              )}
            </div>

            <div className="rounded-xl border border-neutral-200 p-5">
              <h3 className="mb-3 text-lg font-semibold text-neutral-900">Venue and map</h3>
              <div className="rounded-lg bg-neutral-100 p-4 text-sm text-neutral-700">
                <p className="font-semibold">{event.venue || event.location}</p>
                <p className="mt-2">{event.mapDescription || 'Follow campus wayfinding signs to the listed venue.'}</p>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 p-5">
              <h3 className="mb-3 text-lg font-semibold text-neutral-900">Contact organizer</h3>
              <div className="space-y-2 text-sm text-neutral-700">
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary-600" /> {event.contactEmail || event.organizer?.email || 'wellness.events@campushealth.edu'}</p>
                <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary-600" /> {event.contactPhone || '+91-80-5550-1200'}</p>
              </div>
            </div>

            {canManage && (
              <div className="rounded-xl border border-neutral-200 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-neutral-900">Participants</h3>
                  <button type="button" className="btn-secondary text-sm" disabled={busyId === event._id} onClick={() => onLoadRegistrations(event._id)}>
                    Load
                  </button>
                </div>
                {rows.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-600">No participant list loaded yet.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {rows.map((entry) => (
                      <div key={entry.student?._id || entry.registeredAt} className="rounded-lg bg-neutral-50 p-3 text-sm">
                        <p className="font-medium text-neutral-900">
                          {entry.student?.name || `${entry.student?.firstName || ''} ${entry.student?.lastName || ''}`.trim() || entry.student?.email}
                        </p>
                        <p className="text-neutral-500">{entry.student?.email}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [myActivities, setMyActivities] = useState([]);
  const [filters, setFilters] = useState({ search: '', category: '', date: '' });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [registrations, setRegistrations] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const canManage = ['admin', 'counselor', 'peer_supporter'].includes(user?.role);
  const isStudent = user?.role === 'student';

  const registeredIds = useMemo(
    () => new Set(myActivities.map((activityItem) => activityItem._id)),
    [myActivities]
  );

  const stats = useMemo(() => {
    const upcoming = activities.filter((item) => item.status === 'Upcoming' && new Date(item.startDate) > new Date()).length;
    const seats = activities.reduce((sum, item) => sum + Math.max(0, Number(item.capacity || 0) - (item.registeredCount ?? item.registeredStudents?.length ?? 0)), 0);
    return { upcoming, seats, registered: myActivities.length };
  }, [activities, myActivities]);

  const loadActivities = async (overrideFilters = filters) => {
    try {
      setError('');
      setIsLoading(true);
      const params = Object.fromEntries(Object.entries(overrideFilters).filter(([, value]) => value));
      const requests = [activitiesAPI.getActivities(params)];
      if (isStudent) requests.push(activitiesAPI.getMyActivities());
      const [activitiesRes, myRes] = await Promise.all(requests);
      setActivities(activitiesRes.data.activities || []);
      setMyActivities(myRes?.data?.activities || []);
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const handleSearch = (event) => {
    event.preventDefault();
    loadActivities();
  };

  const clearFilters = () => {
    const cleared = { search: '', category: '', date: '' };
    setFilters(cleared);
    loadActivities(cleared);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const buildPayload = () => ({
    ...form,
    capacity: Number(form.capacity),
    duration: Number(form.duration || 60),
    agenda: form.agenda.split('\n').map((item) => item.trim()).filter(Boolean),
    tags: form.tags.split(',').map((item) => item.trim()).filter(Boolean),
    startDate: new Date(form.startDate).toISOString(),
    endDate: new Date(form.endDate).toISOString()
  });

  const handleSaveActivity = async (event) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setError('');
      const payload = buildPayload();

      if (editingId) {
        await activitiesAPI.updateActivity(editingId, payload);
        setMessage('Event updated successfully.');
      } else {
        await activitiesAPI.createActivity(payload);
        setMessage('Event created successfully.');
      }

      resetForm();
      await loadActivities();
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Failed to save event');
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (activityItem) => {
    setEditingId(activityItem._id);
    setForm({
      title: activityItem.title || '',
      description: activityItem.description || '',
      category: activityItem.category || 'Mindfulness',
      image: activityItem.image || '',
      speakerName: activityItem.speakerName || '',
      speakerDesignation: activityItem.speakerDesignation || '',
      venue: activityItem.venue || '',
      location: activityItem.location || '',
      mapDescription: activityItem.mapDescription || '',
      duration: activityItem.duration || 60,
      agenda: listToText(activityItem.agenda),
      contactEmail: activityItem.contactEmail || '',
      contactPhone: activityItem.contactPhone || '',
      tags: csvToText(activityItem.tags),
      startDate: toInputDateTime(activityItem.startDate),
      endDate: toInputDateTime(activityItem.endDate),
      capacity: activityItem.capacity || 30,
      status: activityItem.status || 'Upcoming'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (activityId) => {
    if (!window.confirm('Delete this wellness event? This cannot be undone.')) return;
    try {
      setBusyId(activityId);
      await activitiesAPI.deleteActivity(activityId);
      setMessage('Event deleted successfully.');
      setSelectedEvent((current) => current?._id === activityId ? null : current);
      await loadActivities();
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Failed to delete event');
    } finally {
      setBusyId('');
    }
  };

  const handleRegister = async (activityId) => {
    try {
      setBusyId(activityId);
      await activitiesAPI.register(activityId);
      setMessage('Registration confirmed.');
      await loadActivities();
      if (selectedEvent?._id === activityId) {
        const refreshed = await activitiesAPI.getActivity(activityId);
        setSelectedEvent(refreshed.data.activity);
      }
    } catch (registerError) {
      setError(registerError.response?.data?.message || 'Failed to register');
    } finally {
      setBusyId('');
    }
  };

  const handleCancelRegistration = async (activityId) => {
    try {
      setBusyId(activityId);
      await activitiesAPI.cancelRegistration(activityId);
      setMessage('Registration cancelled.');
      await loadActivities();
      if (selectedEvent?._id === activityId) {
        const refreshed = await activitiesAPI.getActivity(activityId);
        setSelectedEvent(refreshed.data.activity);
      }
    } catch (cancelError) {
      setError(cancelError.response?.data?.message || 'Failed to cancel registration');
    } finally {
      setBusyId('');
    }
  };

  const loadRegistrations = async (activityId) => {
    try {
      setBusyId(activityId);
      const response = await activitiesAPI.getRegistrations(activityId);
      setRegistrations((current) => ({
        ...current,
        [activityId]: response.data.registrations || []
      }));
    } catch (registrationError) {
      setError(registrationError.response?.data?.message || 'Failed to load registrations');
    } finally {
      setBusyId('');
    }
  };

  const isPast = (activityItem) => new Date(activityItem.startDate) <= new Date();
  const registeredCount = (activityItem) => activityItem.registeredCount ?? activityItem.registeredStudents?.length ?? 0;
  const availableSeats = (activityItem) => Math.max(0, Number(activityItem.capacity || 0) - registeredCount(activityItem));

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-secondary-600 p-8 text-white shadow-lg">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4" /> Campus Wellness Events
            </div>
            <h1 className="text-3xl font-bold md:text-4xl">Build healthier routines through meaningful campus experiences.</h1>
            <p className="mt-4 max-w-2xl text-primary-50">
              Explore counselor-led workshops, wellbeing circles, awareness sessions, and practical skill-building events designed for student life.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-3xl font-bold">{stats.upcoming}</p>
              <p className="text-xs text-primary-50">Upcoming</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-3xl font-bold">{stats.seats}</p>
              <p className="text-xs text-primary-50">Seats open</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4 text-center backdrop-blur">
              <p className="text-3xl font-bold">{stats.registered}</p>
              <p className="text-xs text-primary-50">My events</p>
            </div>
          </div>
        </div>
      </section>

      {message ? <div className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">{message}</div> : null}
      {error ? <div className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div> : null}

      {canManage && (
        <form onSubmit={handleSaveActivity} className="card space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">{editingId ? 'Edit Wellness Event' : 'Create Wellness Event'}</h2>
              <p className="text-sm text-neutral-600">Admins and counselors can manage professional campus events and participant lists.</p>
            </div>
            {editingId ? <button type="button" className="btn-outline" onClick={resetForm}>Cancel edit</button> : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input className="form-input" placeholder="Event title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <input className="form-input" placeholder="Speaker name" value={form.speakerName} onChange={(e) => setForm({ ...form, speakerName: e.target.value })} />
            <input className="form-input" placeholder="Speaker designation" value={form.speakerDesignation} onChange={(e) => setForm({ ...form, speakerDesignation: e.target.value })} />
            <input className="form-input" placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value, location: e.target.value || form.location })} required />
            <input className="form-input" placeholder="Campus location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
            <input className="form-input" type="number" min="15" max="480" placeholder="Duration in minutes" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
            <input className="form-input" type="number" min="1" placeholder="Maximum seats" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
            <input className="form-input" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            <input className="form-input" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            <input className="form-input" type="email" placeholder="Organizer contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <input className="form-input" placeholder="Organizer phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
            <select className="form-input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <label className="form-input flex cursor-pointer items-center gap-2">
              <ImagePlus className="h-4 w-4" />
              <span>{form.image ? 'Banner selected' : 'Upload banner image'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>

          <textarea className="form-input min-h-[110px]" placeholder="Professional event description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <textarea className="form-input min-h-[90px]" placeholder="Agenda - one item per line" value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
          <textarea className="form-input min-h-[80px]" placeholder="Campus map directions or landmark details" value={form.mapDescription} onChange={(e) => setForm({ ...form, mapDescription: e.target.value })} />
          <input className="form-input" placeholder="Tags separated by commas" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <button className="btn-primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : editingId ? 'Update Event' : 'Create Event'}
          </button>
        </form>
      )}

      <form onSubmit={handleSearch} className="card">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            <input className="form-input pl-9" placeholder="Search by title, speaker, topic, tag, or venue" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <select className="form-input" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input className="form-input" type="date" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="btn-primary" type="submit">Apply filters</button>
          <button className="btn-outline" type="button" onClick={clearFilters}>Clear</button>
        </div>
      </form>

      {isStudent && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">My Registered Events</h2>
          {myActivities.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600">
              Register for a wellness event and it will be saved here with date, venue, and cancellation options.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {myActivities.map((activityItem) => (
                <div key={activityItem._id} className="rounded-xl border border-primary-100 bg-primary-50 p-4">
                  <p className="font-semibold text-neutral-900">{activityItem.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">{formatDate(activityItem.startDate)} • {formatTime(activityItem.startDate)}</p>
                  <p className="mt-1 text-sm text-neutral-600">{activityItem.venue || activityItem.location}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button className="btn-secondary text-sm" type="button" onClick={() => setSelectedEvent(activityItem)}>Details</button>
                    <button className="btn-outline text-sm" type="button" disabled={busyId === activityItem._id} onClick={() => handleCancelRegistration(activityItem._id)}>Cancel registration</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">Explore Wellness Events</h2>
        {isLoading ? (
          <div className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white p-10 text-neutral-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading wellness events...
          </div>
        ) : activities.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-neutral-600">
            <p className="font-semibold text-neutral-800">Explore campus wellness events.</p>
            <p className="mt-1 text-sm">Clear filters or check the full calendar for workshops, circles, and wellbeing sessions.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {activities.map((activityItem) => {
              const isRegistered = registeredIds.has(activityItem._id);
              const seatsLeft = availableSeats(activityItem);
              const full = seatsLeft <= 0;
              const past = isPast(activityItem);
              const progress = Math.min(100, (registeredCount(activityItem) / Math.max(1, activityItem.capacity)) * 100);

              return (
                <div key={activityItem._id} className="card flex flex-col overflow-hidden p-0">
                  <button type="button" className="h-44 w-full bg-gradient-to-r from-primary-100 to-secondary-100 text-left" onClick={() => setSelectedEvent(activityItem)}>
                    {activityItem.image ? (
                      <img src={activityItem.image} alt={activityItem.title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-primary-600">
                        <Activity className="h-12 w-12" />
                      </div>
                    )}
                  </button>
                  <div className="flex flex-1 flex-col space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">{activityItem.category}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${activityItem.status === 'Upcoming' ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-700'}`}>
                        {activityItem.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900">{activityItem.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{activityItem.description}</p>
                    </div>

                    <div className="space-y-2 text-sm text-neutral-600">
                      <p className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(activityItem.startDate)}</p>
                      <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {formatTime(activityItem.startDate)} • {activityItem.duration || 60} mins</p>
                      <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {activityItem.venue || activityItem.location}</p>
                      <p className="flex items-center gap-2"><User className="h-4 w-4" /> {activityItem.speakerName || 'Campus Wellness Team'}</p>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between text-xs text-neutral-500">
                        <span>{registeredCount(activityItem)} / {activityItem.capacity} registered</span>
                        <span>{seatsLeft} seats left</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-100">
                        <div className="h-2 rounded-full bg-primary-600" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(activityItem.tags || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600">#{tag}</span>
                      ))}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <button type="button" className="btn-secondary flex-1" onClick={() => setSelectedEvent(activityItem)}>Learn more</button>
                      {isStudent && (
                        isRegistered ? (
                          <button className="btn-outline flex-1" type="button" disabled={busyId === activityItem._id} onClick={() => handleCancelRegistration(activityItem._id)}>Cancel</button>
                        ) : (
                          <button className="btn-primary flex-1" type="button" disabled={busyId === activityItem._id || full || past || activityItem.status !== 'Upcoming'} onClick={() => handleRegister(activityItem._id)}>
                            {full ? 'Full' : past ? 'Closed' : 'Register'}
                          </button>
                        )
                      )}

                      {canManage && (
                        <>
                          <button className="btn-outline inline-flex items-center gap-2" type="button" onClick={() => startEdit(activityItem)}>
                            <Edit3 className="h-4 w-4" /> Edit
                          </button>
                          <button className="btn-outline inline-flex items-center gap-2 text-danger-600" type="button" disabled={busyId === activityItem._id} onClick={() => handleDelete(activityItem._id)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                          <button className="btn-outline" type="button" disabled={busyId === activityItem._id} onClick={() => {
                            setSelectedEvent(activityItem);
                            loadRegistrations(activityItem._id);
                          }}>
                            Participants
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <EventDetailsModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        isRegistered={selectedEvent ? registeredIds.has(selectedEvent._id) : false}
        isStudent={isStudent}
        canManage={canManage}
        onRegister={handleRegister}
        onCancel={handleCancelRegistration}
        busyId={busyId}
        registrations={registrations}
        onLoadRegistrations={loadRegistrations}
      />
    </div>
  );
}

export default ActivitiesPage;
