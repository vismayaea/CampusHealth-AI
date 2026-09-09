import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  ExternalLink,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  User,
  Users,
  X
} from 'lucide-react';
import { counselorsAPI } from '../services/api';

const truncateText = (text = '', maxLength = 150) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const getInitials = (name = 'Counselor') => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase())
  .join('') || 'C';

const externalProfessionalReferences = [
  {
    _id: 'external-anjali-chhabria',
    name: 'Dr. Anjali Chhabria',
    specialization: 'Psychiatry, psychotherapy, and workplace wellbeing',
    qualification: 'MBBS, MD Psychiatry, Diploma in Psychotherapy',
    experience: 35,
    experienceSuffix: '+',
    languages: ['English'],
    city: 'Mumbai',
    status: 'External reference',
    availabilityLabel: 'See external professional profile',
    linkedInUrl: 'https://in.linkedin.com/in/anjali-chhabria-81154322',
    isExternalReference: true,
    bio: 'Dr. Anjali Chhabria is publicly known for work spanning psychiatry, psychotherapy, child and adolescent mental health, and workplace wellbeing. This original directory summary is provided only as a professional reference and does not indicate employment, endorsement, availability, or affiliation with this platform.'
  },
  {
    _id: 'external-anjana-chabria',
    name: 'Anjana Chabria',
    specialization: 'Psychotherapy, CBT, REBT, NLP, and workplace wellbeing',
    qualification: 'Counseling professional, University of Mumbai',
    experience: 30,
    experienceSuffix: '+',
    languages: ['English'],
    city: 'Mumbai',
    status: 'External reference',
    availabilityLabel: 'See external professional profile',
    linkedInUrl: 'https://in.linkedin.com/in/anjanachabria',
    isExternalReference: true,
    bio: 'Anjana Chabria is publicly known for psychotherapy work using approaches including CBT, REBT, and NLP, with experience relevant to individual and workplace wellbeing. This original directory summary is provided only as a professional reference and does not indicate employment, endorsement, availability, or affiliation with this platform.'
  }
];

function CounselorCard({ counselor, onLearnMore }) {
  const isAvailable = counselor.status === 'Available';
  const navigate = useNavigate();

  return (
    <div className="card-hover h-full flex flex-col overflow-hidden">
      <div className="relative">
        <div className="h-32 bg-gradient-to-br from-primary-100 via-secondary-100 to-success-100" />
        <div className="absolute -bottom-10 left-6">
          {counselor.profileImage ? (
            <img
              src={counselor.profileImage}
              alt={counselor.name}
              className="h-20 w-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
                event.currentTarget.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div
            className={`h-20 w-20 rounded-2xl border-4 border-white shadow-md bg-primary-600 text-white items-center justify-center text-xl font-bold ${counselor.profileImage ? 'hidden' : 'flex'}`}
          >
            {getInitials(counselor.name)}
          </div>
        </div>
        <div className="absolute top-4 right-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
            isAvailable
              ? 'bg-success-100 text-success-700'
              : 'bg-warning-100 text-warning-700'
          }`}>
            <span className={`mr-2 h-2 w-2 rounded-full ${isAvailable ? 'bg-success-500' : 'bg-warning-500'}`} />
            {counselor.availabilityLabel || counselor.status || 'Available'}
          </span>
        </div>
      </div>

      <div className="pt-12 flex flex-col flex-1">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-neutral-900 mb-1">{counselor.name}</h3>
          <p className="text-sm font-medium text-primary-600">{counselor.specialization}</p>
        </div>

        <div className="space-y-3 text-sm text-neutral-600 mb-4">
          <div className="flex items-start">
            <GraduationCap className="h-4 w-4 mr-2 mt-0.5 text-neutral-400 flex-shrink-0" />
            <span>{counselor.qualification}</span>
          </div>
          <div className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-neutral-400 flex-shrink-0" />
            <span>{Number(counselor.experience || 0)}{counselor.experienceSuffix || ''} years of experience</span>
          </div>
          <div className="flex items-center">
            <Languages className="h-4 w-4 mr-2 text-neutral-400 flex-shrink-0" />
            <span>{(counselor.languages || []).join(', ')}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-neutral-400 flex-shrink-0" />
            <span>{counselor.city}</span>
          </div>
          <div className="flex items-center">
            <Mail className="h-4 w-4 mr-2 text-neutral-400 flex-shrink-0" />
            <span>{counselor.email}</span>
          </div>
          <div className="flex items-center">
            <Phone className="h-4 w-4 mr-2 text-neutral-400 flex-shrink-0" />
            <span>{counselor.phone}</span>
          </div>
        </div>

        <div className="mb-6 flex-1">
          <h4 className="text-sm font-semibold text-neutral-900 mb-2">About</h4>
          <p className="text-sm text-neutral-600 leading-relaxed">
            {truncateText(counselor.bio || 'Professional counseling profile summary will be shared by the campus wellness team.')}
          </p>
        </div>

        {counselor.isExternalReference && (
          <p className="mb-4 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-800">
            Independent public reference. Not affiliated with or bookable through this platform.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onLearnMore(counselor)}
            className="btn-secondary w-full inline-flex items-center justify-center"
          >
            Learn More
          </button>
          {counselor.linkedInUrl ? (
            <a
              href={counselor.linkedInUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${counselor.name}'s external LinkedIn professional profile in a new tab`}
              className="btn-secondary w-full inline-flex items-center justify-center"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View LinkedIn
            </a>
          ) : (
            <button
              type="button"
              onClick={() => navigate(`/app/appointments?tab=book&counselorId=${encodeURIComponent(counselor._id)}`)}
              className="btn-primary w-full inline-flex items-center justify-center"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Book Appointment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function CounselorsPage() {
  const [counselors, setCounselors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCounselor, setSelectedCounselor] = useState(null);

  useEffect(() => {
    if (!selectedCounselor) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedCounselor(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedCounselor]);

  const fetchCounselors = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await counselorsAPI.getCounselors({
        limit: 100,
        sortBy: 'name',
        sortOrder: 'asc'
      });
      setCounselors(response.data?.counselors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load counselors. Please try again.');
      setCounselors([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounselors();
  }, []);

  const filteredCounselors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return counselors.filter((counselor) => {
      const matchesStatus = statusFilter === 'all' || counselor.status === statusFilter;
      const searchableText = [
        counselor.name,
        counselor.specialization,
        counselor.qualification,
        (counselor.languages || []).join(' '),
        counselor.city,
        counselor.bio
      ].join(' ').toLowerCase();
      return matchesStatus && (!normalizedSearch || searchableText.includes(normalizedSearch));
    });
  }, [counselors, searchTerm, statusFilter]);

  return (
    <div className="space-y-8">
      <div className="page-hero flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-4 bg-primary-100 rounded-2xl shadow-soft">
            <Users className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Counselors</h1>
            <p className="text-neutral-600 text-lg">Find the right campus mental health professional for your needs</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, specialization, qualification..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="form-input pl-11 w-full"
            />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="form-select w-full sm:w-48"
        >
          <option value="all">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Busy">Busy</option>
        </select>
      </div>

      <section aria-labelledby="external-professional-references">
        <div className="mb-5">
          <h2 id="external-professional-references" className="text-xl font-semibold text-neutral-900">
            External Professional References
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Public professional profiles for reference only. These individuals are not represented as employees,
            partners, available counselors, or affiliates of this platform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {externalProfessionalReferences.map((counselor) => (
            <CounselorCard
              key={counselor._id}
              counselor={counselor}
              onLearnMore={setSelectedCounselor}
            />
          ))}
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="card animate-pulse">
              <div className="h-32 bg-neutral-100 rounded-lg mb-12" />
              <div className="h-5 bg-neutral-100 rounded w-2/3 mb-3" />
              <div className="h-4 bg-neutral-100 rounded w-1/2 mb-6" />
              <div className="space-y-3 mb-6">
                <div className="h-4 bg-neutral-100 rounded" />
                <div className="h-4 bg-neutral-100 rounded w-3/4" />
                <div className="h-4 bg-neutral-100 rounded w-5/6" />
              </div>
              <div className="h-10 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12">
          <AlertCircle className="h-14 w-14 mx-auto mb-4 text-danger-500" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Could not load counselors</h3>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button type="button" onClick={fetchCounselors} className="btn-primary inline-flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </button>
        </div>
      ) : filteredCounselors.length === 0 ? (
        <div className="card text-center py-12">
          <User className="h-16 w-16 mx-auto mb-4 text-neutral-300" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Refine your counselor search</h3>
          <p className="text-neutral-600">
            {counselors.length === 0
              ? 'The counselor directory is being prepared by the campus wellness team.'
              : 'Try adjusting your search or status filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCounselors.map((counselor) => (
            <CounselorCard
              key={counselor._id}
              counselor={counselor}
              onLearnMore={setSelectedCounselor}
            />
          ))}
        </div>
      )}

      {selectedCounselor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedCounselor(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="counselor-dialog-title"
            className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary-600">{selectedCounselor.specialization}</p>
                <h2 id="counselor-dialog-title" className="mt-1 text-2xl font-bold text-neutral-900">
                  {selectedCounselor.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCounselor(null)}
                aria-label="Close counselor details"
                className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-neutral-600 sm:grid-cols-2">
              <p><span className="font-semibold text-neutral-900">Qualification:</span> {selectedCounselor.qualification}</p>
              <p><span className="font-semibold text-neutral-900">Experience:</span> {selectedCounselor.experience}{selectedCounselor.experienceSuffix || ''} years</p>
              <p><span className="font-semibold text-neutral-900">City:</span> {selectedCounselor.city}</p>
              <p><span className="font-semibold text-neutral-900">Languages:</span> {(selectedCounselor.languages || []).join(', ')}</p>
              <p className="sm:col-span-2"><span className="font-semibold text-neutral-900">Availability:</span> {selectedCounselor.availabilityLabel || selectedCounselor.status}</p>
            </div>

            <div className="mt-6 border-t border-neutral-200 pt-5">
              <h3 className="font-semibold text-neutral-900">About</h3>
              <p className="mt-2 leading-relaxed text-neutral-600">{selectedCounselor.bio}</p>
            </div>

            {selectedCounselor.isExternalReference && (
              <p className="mt-5 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
                This is an independent external professional reference. No employment, endorsement, availability,
                partnership, or affiliation with this platform is implied.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CounselorsPage;
