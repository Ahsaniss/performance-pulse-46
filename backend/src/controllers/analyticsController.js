const Task = require('../models/Task');
const User = require('../models/User');
const { GoogleGenAI } = require("@google/genai");

// Helper to calculate metrics
const calculateMetrics = (tasks) => {
  const total = tasks.length;
  if (total === 0) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // Helper for weighted score
  const getWeight = (difficulty) => {
    if (difficulty === 'high') return 3;
    if (difficulty === 'medium') return 2;
    return 1; // low
  };

  // --- Current Period Metrics (Last 30 Days) ---
  const currentTasks = tasks.filter(t => new Date(t.createdAt) >= thirtyDaysAgo);
  
  // Weighted Efficiency
  let totalWeight = 0;
  let completedWeight = 0;
  currentTasks.forEach(t => {
    const w = getWeight(t.difficulty);
    totalWeight += w;
    if (t.status === 'completed') completedWeight += w;
  });
  const efficiencyScore = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;

  // --- Previous Period Metrics (30-60 Days Ago) ---
  const prevTasks = tasks.filter(t => {
    const d = new Date(t.createdAt);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo;
  });
  
  let prevTotalWeight = 0;
  let prevCompletedWeight = 0;
  prevTasks.forEach(t => {
    const w = getWeight(t.difficulty);
    prevTotalWeight += w;
    if (t.status === 'completed') prevCompletedWeight += w;
  });
  const prevEfficiencyScore = prevTotalWeight > 0 ? (prevCompletedWeight / prevTotalWeight) * 100 : 0;

  // Trend Calculation
  const efficiencyTrend = efficiencyScore - prevEfficiencyScore;

  // --- General Stats (All Time) ---
  const completed = tasks.filter(t => t.status === 'completed');
  const pending = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress');
  const overdue = tasks.filter(t => {
    return t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date();
  });

  // Completion Rate
  const completionRate = (completed.length / total) * 100;

  // On-Time Delivery & Turnaround Time
  let onTimeCount = 0;
  let totalTurnaroundTime = 0;
  let tasksWithStartTime = 0;

  completed.forEach(task => {
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const completedAt = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt);

    if (deadline && completedAt <= deadline) {
      onTimeCount++;
    }

    // Only calculate turnaround for tasks that were actually started
    // This excludes waiting/queue time
    if (task.startedAt) {
      const startTime = new Date(task.startedAt);
      totalTurnaroundTime += (completedAt - startTime);
      tasksWithStartTime++;
    }
  });

  const timelinessScore = completed.length > 0 ? (onTimeCount / completed.length) * 100 : 0;
  const avgTurnaroundTimeDays = tasksWithStartTime > 0 ? (totalTurnaroundTime / tasksWithStartTime) / (1000 * 60 * 60 * 24) : 0;

  return {
    total,
    completed: completed.length,
    pending: pending.length,
    overdue: overdue.length,
    completionRate: completionRate.toFixed(1),
    timelinessScore: timelinessScore.toFixed(1),
    avgTurnaroundTime: avgTurnaroundTimeDays.toFixed(1),
    efficiencyScore: efficiencyScore.toFixed(1),
    trends: {
      efficiency: efficiencyTrend.toFixed(1)
    },
    tasks // Return raw tasks for graphs
  };
};

// @desc    Get Employee Analytics
// @route   GET /api/analytics/employee/:id
// @access  Private (Admin or Self)
exports.getEmployeeAnalytics = async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    // Security check
    if (req.user.role !== 'admin' && req.user.id !== employeeId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const tasks = await Task.find({ assignedTo: employeeId }).sort('-createdAt');
    const metrics = calculateMetrics(tasks);

    if (!metrics) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get AI Performance Insight
// @route   POST /api/analytics/ai-insight
// @access  Private (Admin)
exports.getAIInsight = async (req, res) => {
  try {
    const { metrics, employeeName } = req.body;
    console.log("Received AI Request for:", employeeName);
    console.log("Metrics:", JSON.stringify(metrics, null, 2));

    if (!process.env.GEMINI_API_KEY) {
      console.error("Gemini API Key is missing");
      return res.json({ success: true, data: "AI Insights are disabled (Missing API Key)." });
    }

    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
You are an HR Performance Analyst. Using ONLY the provided metrics, write a detailed performance brief for employee "${employeeName}".

Data (do not invent):
- Completion Rate: ${metrics.completionRate}%
- On-Time Delivery: ${metrics.timelinessScore}%
- Average Turnaround Time: ${metrics.avgTurnaroundTime} days
- Overdue Tasks: ${metrics.overdue}
- Total Tasks: ${metrics.total}

Output structure (4–6 sentences, ~120–180 words):
1) Opening snapshot: overall performance and trajectory (strengths + weaknesses based on the numbers).
2) Delivery quality: on-time vs overdue implications; call out risk areas.
3) Velocity/throughput: what turnaround time suggests; any pacing concerns.
4) Recommendations: 2–3 specific, manager-ready actions (e.g., rebalance workload, add support, set targets, coaching focus).
5) Optional coaching note for the employee (concise, constructive).

Constraints:
- Be professional, evidence-based, and actionable.
- If any metric is missing, state that briefly and adjust recommendations accordingly.
- No assumptions beyond the data; do not fabricate metrics.
`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    res.json({ success: true, data: response.text });
  } catch (error) {
    console.error('AI Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate AI insight',
      error: error.message 
    });
  }
};

// @desc    Chat with AI about Employee
// @route   POST /api/analytics/chat
// @access  Private (Admin)
exports.chatWithAI = async (req, res) => {
  try {
    const { message, employeeName, metrics, taskHistory, chatHistory } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ success: true, data: "AI Chat is disabled (Missing API Key)." });
    }

    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Construct context from metrics and recent tasks
    const recentTasks = taskHistory ? taskHistory.slice(0, 5).map(t => `- ${t.title} (${t.status}): ${t.difficulty || 'Medium'}`).join('\n') : 'No recent tasks';
    
    const systemContext = `
      You are an expert HR Performance Assistant. You are discussing the employee "${employeeName}".
      
      Here is their current performance data:
      - Completion Rate: ${metrics.completionRate}%
      - On-Time Delivery: ${metrics.timelinessScore}%
      - Avg Turnaround: ${metrics.avgTurnaroundTime} days
      - Efficiency Score: ${metrics.efficiencyScore}%
      - Overdue Tasks: ${metrics.overdue}
      
      Recent Tasks:
      ${recentTasks}
      
      Answer the user's question based strictly on this data. Be professional, concise, and helpful.
      If the user asks about something not in the data, politely say you don't have that information.
    `;

    // Build conversation history for the API
    const contents = [
      { role: "user", parts: [{ text: systemContext }] },
      { role: "model", parts: [{ text: "Understood. I am ready to answer questions about this employee's performance." }] }
    ];

    // Add previous chat history
    if (chatHistory && chatHistory.length > 0) {
      chatHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: contents
    });

    res.json({ success: true, data: response.text });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, message: 'Chat failed', error: error.message });
  }
};
