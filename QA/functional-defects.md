# Functional Defects

## Critical Issues
- **Google Integration Failures**: CORS errors when integrating with Google Sheets
- **Session Management**: No proper session timeout or handling
- **Offline Capability**: App fails completely when offline
- **Edge Case Handling**: No handling for:
  - Employees with same name
  - Extremely large datasets
  - Special characters in inputs
- **PDF Export**: Feature mentioned in requirements but not implemented

## Recommended Fixes
- Fix CORS issues or create proper backend API
- Add offline capability using Service Workers
- Implement proper session management
- Add comprehensive validation and error handling for edge cases
- Implement the PDF export functionality using a library like jsPDF
