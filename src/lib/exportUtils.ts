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
      csv += `"${task.title}","${task.status}","${task.priority}","${task.deadline || 'N/A'}"\n`;
    });
    csv += '\n';

    // Evaluations
    csv += 'Performance Evaluations\n';
    csv += 'Date,Score,Meetings,Training,Outcome\n';
    data.evaluations.forEach(evaluation => {
      csv += `"${new Date(evaluation.date).toLocaleDateString()}","${evaluation.score}","${evaluation.meetingsHeld || 0}","${evaluation.trainingApplied || 0}","${evaluation.outcomeSummary || 'N/A'}"\n`;
    });
    csv += '\n';

    // Attendance
    csv += 'Attendance Record\n';
    csv += 'Date,Check In,Check Out,Status\n';
    data.attendance.forEach(record => {
      const checkIn = record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A';
      const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A';
      csv += `"${new Date(record.date).toLocaleDateString()}","${checkIn}","${checkOut}","${record.status}"\n`;
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
                <td>${task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/A'}</td>
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
                <td>${new Date(evaluation.date).toLocaleDateString()}</td>
                <td>${evaluation.score}/100</td>
                <td>${evaluation.meetingsHeld || 0}</td>
                <td>${evaluation.trainingApplied || 0}</td>
                <td>${evaluation.outcomeSummary || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Attendance Record</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.attendance.map(record => `
              <tr>
                <td>${new Date(record.date).toLocaleDateString()}</td>
                <td>${record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : 'N/A'}</td>
                <td>${record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : 'N/A'}</td>
                <td>${record.status}</td>
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

export const exportPerformanceSummary = (employees: any[], tasks: any[], evaluations: any[]) => {
  try {
    const rows = employees.map((emp) => {
      const empTasks = tasks.filter((task: any) => task.assignedTo === emp.id);
      const completedCount = empTasks.filter((task: any) => task.status === 'completed').length;
      const pendingCount = empTasks.length - completedCount;
      const latestEvaluation = evaluations
        .filter((evaluation: any) => evaluation.employeeId === emp.id)
        .sort((a: any, b: any) => new Date(b.date || b.createdAt || '').getTime() - new Date(a.date || a.createdAt || '').getTime())[0];
      return {
        Name: emp.name,
        Department: emp.department,
        CompletedTasks: completedCount,
        PendingTasks: pendingCount,
        LatestScore: latestEvaluation?.score ?? 'N/A',
        LastEvaluatedOn: latestEvaluation?.date ?? 'N/A',
      };
    });
    const header = Object.keys(rows[0] ?? { Name: '', Department: '', CompletedTasks: 0, PendingTasks: 0, LatestScore: '', LastEvaluatedOn: '' });
    const csv = [header.join(','), ...rows.map((row) => header.map((key) => `"${String((row as any)[key] ?? '')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `performance-summary-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Performance summary exported');
  } catch (error) {
    console.error('Export failed:', error);
    toast.error('Failed to export performance summary');
  }
};
