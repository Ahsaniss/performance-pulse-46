import { toast } from 'sonner';

interface EmployeeData {
  name: string;
  email: string;
  department: string;
  position: string;
  tasks: any[];
  evaluations: any[];
  attendance: any[];
}

export const exportToCSV = (data: EmployeeData) => {
  try {
    // Create CSV content
    let csv = 'Employee Performance Report\n\n';
    
    // Employee Info
    csv += 'Employee Information\n';
    csv += `Name,${data.name}\n`;
    csv += `Email,${data.email}\n`;
    csv += `Department,${data.department}\n`;
    csv += `Position,${data.position}\n\n`;

    // Tasks Summary
    csv += 'Tasks Summary\n';
    csv += 'Title,Status,Priority,Due Date\n';
    data.tasks.forEach(task => {
      csv += `"${task.title}","${task.status}","${task.priority}","${task.due_date || 'N/A'}"\n`;
    });
    csv += '\n';

    // Evaluations
    csv += 'Performance Evaluations\n';
    csv += 'Date,Score,Meetings,Training,Outcome\n';
    data.evaluations.forEach(evaluation => {
      csv += `"${new Date(evaluation.evaluation_date).toLocaleDateString()}","${evaluation.satisfaction_score}","${evaluation.meetings_held}","${evaluation.training_applied}","${evaluation.outcome_summary || 'N/A'}"\n`;
    });

    // Create download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.name.replace(/\s+/g, '_')}_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Report exported successfully!');
  } catch (error) {
    console.error('Export error:', error);
    toast.error('Failed to export report');
  }
};

export const exportToPDF = (data: EmployeeData) => {
  // For a simple implementation, we'll create an HTML page and trigger print
  try {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Report - ${data.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          h2 { color: #666; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; font-weight: bold; }
          .info { margin: 20px 0; }
          .info p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h1>Employee Performance Report</h1>
        
        <div class="info">
          <h2>Employee Information</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Department:</strong> ${data.department}</p>
          <p><strong>Position:</strong> ${data.position}</p>
        </div>

        <h2>Tasks Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${data.tasks.map(task => `
              <tr>
                <td>${task.title}</td>
                <td>${task.status}</td>
                <td>${task.priority}</td>
                <td>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Performance Evaluations</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Score</th>
              <th>Meetings</th>
              <th>Training</th>
              <th>Outcome</th>
            </tr>
          </thead>
          <tbody>
            ${data.evaluations.map(evaluation => `
              <tr>
                <td>${new Date(evaluation.evaluation_date).toLocaleDateString()}</td>
                <td>${evaluation.satisfaction_score}/5</td>
                <td>${evaluation.meetings_held}</td>
                <td>${evaluation.training_applied}</td>
                <td>${evaluation.outcome_summary || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    toast.success('Opening print dialog...');
  } catch (error) {
    console.error('PDF export error:', error);
    toast.error('Failed to export PDF');
  }
};
