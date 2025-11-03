// Mock authentication data for frontend-only mode
// Initialize default users for testing

export const DEFAULT_USERS = [
  {
    id: 'admin_001',
    email: 'admin@test.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  {
    id: 'employee_001',
    email: 'employee@test.com',
    password: 'employee123',
    name: 'John Employee',
    role: 'employee',
  },
];

export const initializeMockUsers = () => {
  const existingUsers = localStorage.getItem('mockUsers');
  
  if (!existingUsers) {
    localStorage.setItem('mockUsers', JSON.stringify(DEFAULT_USERS));
    console.log('✅ Default users initialized:');
    console.log('👤 Admin: admin@test.com / admin123');
    console.log('👤 Employee: employee@test.com / employee123');
  }
};

export const getMockUsers = () => {
  const usersData = localStorage.getItem('mockUsers');
  return usersData ? JSON.parse(usersData) : DEFAULT_USERS;
};
