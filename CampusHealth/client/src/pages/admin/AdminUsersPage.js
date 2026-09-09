import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { adminAPI } from '../../services/api';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminAPI.getUsers({
        search: searchTerm,
        role: roleFilter,
        status: statusFilter,
        department: departmentFilter
      });
      setUsers(res.data.users || []);
      setError('');
    } catch (error) {
      console.error('Failed to fetch users', error);
      setError('User records could not be loaded right now. Please retry after a moment.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, roleFilter, statusFilter, departmentFilter]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const toggleUserStatus = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} this user?`)) return;
    try {
      await adminAPI.updateUserStatus(user._id, !user.isActive);
      setUsers(users.map(u => u._id === user._id ? { ...u, isActive: !user.isActive } : u));
      setNotice(`${user.firstName || 'User'} ${user.isActive ? 'deactivated' : 'activated'} successfully.`);
      setError('');
    } catch (error) {
      console.error('Failed to update status', error);
      setError('User status could not be updated. Please try again.');
    }
  };

  const deleteUser = async (user) => {
    if (user.role === 'admin') {
       setNotice('Admin accounts are protected and cannot be deleted from this workspace.');
       return;
    }
    if (!window.confirm(`Are you sure you want to PERMANENTLY delete user ${user.email}? This action cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(user._id);
      setUsers(users.filter(u => u._id !== user._id));
      setNotice(`${user.firstName || 'User'} removed successfully.`);
      setError('');
    } catch (error) {
      console.error('Failed to delete user', error);
      setError('User could not be deleted. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-primary-100 rounded-lg">
          <Users className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">User Management</h1>
          <p className="text-neutral-600">Manage users, roles, and login access</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or student ID..."
              className="form-input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <select 
          className="form-input" 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="counselor">Counselor</option>
          <option value="admin">Admin</option>
        </select>

        <select 
          className="form-input" 
          value={departmentFilter} 
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Psychology">Psychology</option>
          <option value="Engineering">Engineering</option>
          <option value="Business">Business</option>
          <option value="Arts">Arts</option>
          <option value="Science">Science</option>
        </select>

        <select 
          className="form-input" 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {notice && (
        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 flex items-center justify-between gap-4">
          <span className="inline-flex items-center"><AlertCircle className="h-4 w-4 mr-2" /> {error}</span>
          <button type="button" className="font-medium underline" onClick={fetchUsers}>Retry</button>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8 text-neutral-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-neutral-500">
              <Users className="h-10 w-10 mx-auto mb-3 text-neutral-300" />
              <p className="font-medium text-neutral-700">No matching users for the current filters.</p>
              <p className="mt-1 text-sm">Clear or adjust filters to review the campus community directory.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === 'counselor' ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600'}`}>
                          <span className="text-sm font-medium">{user.firstName?.charAt(0) || 'U'}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-neutral-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-neutral-500">{user.email} {user.studentId ? `(${user.studentId})` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-danger-100 text-danger-700' : user.role === 'counselor' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">
                      {user.department || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.isActive ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => toggleUserStatus(user)} 
                          className={`${user.isActive ? 'text-danger-600 hover:text-danger-900' : 'text-success-600 hover:text-success-900'} transition-colors`}
                          title={user.isActive ? "Deactivate User" : "Activate User"}
                          disabled={user.role === 'admin'}
                        >
                          {user.isActive ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                        </button>
                        <button 
                          onClick={() => deleteUser(user)}
                          className="text-neutral-400 hover:text-danger-600 transition-colors ml-2"
                          title="Delete User"
                          disabled={user.role === 'admin'}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminUsersPage;
