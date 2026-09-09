const demoAccounts = [
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

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const findDemoAccount = ({ email, password, role } = {}) => demoAccounts.find((account) => {
  const emailMatches = !email || normalizeEmail(account.email) === normalizeEmail(email);
  const passwordMatches = password === undefined || account.password === password;
  const roleMatches = !role || account.user.role === role;
  return emailMatches && passwordMatches && roleMatches;
});

module.exports = {
  demoAccounts,
  findDemoAccount
};
