import React from 'react';
import { User, Mail, Phone, Calendar, GraduationCap, Globe, Edit } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function ProfilePage() {
  const { user } = useAuth();
  const firstName = user?.firstName || '';
  const lastName = user?.lastName || '';
  const email = user?.email || '';
  const phone = user?.phone || '';
  const department = user?.department || '';
  const yearOfStudy = user?.yearOfStudy || '';
  const preferredLanguage = user?.preferredLanguage || '';
  return (
    <div className="space-y-6">
      <div className="page-hero flex items-center space-x-3">
        <div className="p-3 bg-primary-100 rounded-2xl shadow-soft">
          <User className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Profile</h1>
          <p className="text-neutral-600">Manage your account information and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-neutral-900">Personal Information</h2>
              <button className="btn-outline inline-flex items-center px-3 py-2 opacity-70" disabled title="Profile edits are managed by campus administration for this demo workspace.">
                <Edit className="mr-2 h-4 w-4" />
                Verified Profile
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    className="form-input pl-10"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Last Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={lastName}
                    className="form-input pl-10"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    className="form-input pl-10"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    className="form-input pl-10"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Department</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <GraduationCap className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={department}
                    className="form-input pl-10"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Year of Study</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={yearOfStudy}
                    className="form-input pl-10"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Preferred Language</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={preferredLanguage}
                    className="form-input pl-10"
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-neutral-900 mb-4">Profile Picture</h3>
            <div className="text-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-12 w-12 text-primary-600" />
              </div>
              <button className="btn-outline text-sm opacity-70" disabled title="Profile photos are managed by campus administration.">Photo Managed</button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-neutral-900 mb-4">Account Settings</h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-600">
                Password, privacy, and notification preferences are available from the secure header settings and account recovery flows.
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-neutral-900 mb-4">Account Statistics</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Chat Sessions</span>
                <span className="font-medium">12</span>
              </div>
              <div className="flex justify-between">
                <span>Screenings Taken</span>
                <span className="font-medium">3</span>
              </div>
              <div className="flex justify-between">
                <span>Resources Viewed</span>
                <span className="font-medium">8</span>
              </div>
              <div className="flex justify-between">
                <span>Forum Posts</span>
                <span className="font-medium">5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
