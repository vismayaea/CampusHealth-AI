export const demoAccounts = [
  {
    label: 'Student',
    email: 'aarav.mehta@university.edu',
    password: 'password123',
    user: {
      _id: 'demo-student-aarav',
      id: 'demo-student-aarav',
      studentId: 'STU001',
      email: 'aarav.mehta@university.edu',
      firstName: 'Aarav',
      lastName: 'Mehta',
      name: 'Aarav Mehta',
      role: 'student',
      department: 'Computer Science',
      yearOfStudy: '3rd Year',
      preferredLanguage: 'en',
      isActive: true
    }
  },
  {
    label: 'Counselor',
    email: 'ananya.mehta@university.edu',
    password: 'password123',
    user: {
      _id: 'demo-counselor-ananya',
      id: 'demo-counselor-ananya',
      studentId: 'COUN001',
      email: 'ananya.mehta@university.edu',
      firstName: 'Dr. Ananya',
      lastName: 'Mehta',
      name: 'Dr. Ananya Mehta',
      role: 'counselor',
      department: 'Student Wellness Centre',
      yearOfStudy: 'PhD',
      preferredLanguage: 'en',
      isActive: true
    }
  },
  {
    label: 'Admin',
    email: 'admin@university.edu',
    password: 'admin123',
    user: {
      _id: 'demo-admin-campus',
      id: 'demo-admin-campus',
      studentId: 'ADMIN001',
      email: 'admin@university.edu',
      firstName: 'Campus',
      lastName: 'Administrator',
      name: 'Campus Administrator',
      role: 'admin',
      department: 'Campus Wellness Administration',
      yearOfStudy: 'PhD',
      preferredLanguage: 'en',
      isActive: true
    }
  }
];

export const findDemoAccount = ({ email, password }) => demoAccounts.find((account) => (
  account.email.toLowerCase() === String(email || '').trim().toLowerCase()
  && account.password === password
));

export const createDemoAuthPayload = (account) => ({
  token: `demo-token-${account.user.role}`,
  accessToken: `demo-token-${account.user.role}`,
  refreshToken: '',
  expiresIn: 'demo',
  user: account.user
});

export const getDashboardPath = (role) => {
  if (role === 'counselor') return '/app/counselor/dashboard';
  if (role === 'admin') return '/app/admin/dashboard';
  return '/app/dashboard';
};
