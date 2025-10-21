import { googleSheetsService } from './lib/googleSheets';

// Test function - call this from console
export async function testGoogleSheets() {
  console.log('Testing Google Sheets connection...');
  console.log('Script URL:', import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL);
  
  try {
    // Test getting employees
    const employees = await googleSheetsService.getEmployees();
    console.log('✅ Successfully fetched employees:', employees);
    
    // Test adding an employee
    const testEmployee = {
      id: 'test-' + Date.now(),
      name: 'Test Employee',
      email: 'test@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      department: 'Testing',
      position: 'Test Position',
      role: 'employee' as const,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active' as const,
      performanceScore: 0,
    };
    
    const success = await googleSheetsService.addEmployee(testEmployee);
    console.log('✅ Add employee result:', success);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Auto-run test (remove this after testing)
// testGoogleSheets();
