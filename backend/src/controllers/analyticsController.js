const Task = require('../models/Task');
const User = require('../models/User');
const { GoogleGenAI } = require("@google/genai");

// Small helpers
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry wrapper to smooth over transient 503/high-demand or quota blips
const generateWithRetry = async (genAI, options, { retries = 2, backoffMs = 800 } = {}) => {
  let attempt = 0;
  let delay = backoffMs;

  // Trim empty contents upfront to avoid API errors
  if (!options?.contents || options.contents.length === 0) {
    throw new Error('Missing contents for generateContent');
  }

  while (true) {
    try {
      return await genAI.models.generateContent(options);
    } catch (err) {
      const status = err?.response?.status || err?.status || err?.code;
      const apiStatus = err?.response?.data?.error?.status;
      const isUnavailable = status === 503 || apiStatus === 'UNAVAILABLE';
      const isResourceExhausted = apiStatus === 'RESOURCE_EXHAUSTED';

      if (attempt < retries && (isUnavailable || isResourceExhausted)) {
        await wait(delay);
        attempt += 1;
        delay *= 2;
        continue;
      }

      throw err;
    }
  }
};

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
  You are an HR Performance Analyst writing a brief for the ADMIN/MANAGER about employee performance (not directly to the employee). Keep it professional, clear, and actionable for leadership decisions.

  <employee_data>
  Employee: ${employeeName}
  Completion Rate: ${metrics.completionRate}%
  On-Time Delivery: ${metrics.timelinessScore}%
  Average Turnaround Time: ${metrics.avgTurnaroundTime} days
  Overdue Tasks: ${metrics.overdue}
  Total Tasks: ${metrics.total}
  </employee_data>

  <task>
  Produce three sections tailored to the manager:

  **Section 1: Current State (2-3 sentences)**
  - Summarize performance with the numbers above (call out strengths + issues).
  - Note any risk signals (overdue load, low completion, etc.).

  **Section 2: Impact/Risks (2-3 sentences)**
  - Explain how the current pattern affects team delivery, dependencies, or quality.
  - Highlight any urgency (e.g., overdue items blocking others).

  **Section 3: Recommended Manager Actions (3-5 bullets)**
  - Give concrete steps the manager can take this week (e.g., re-prioritize queue, assign support, set daily check-ins, unblock dependencies, adjust scope).
  - Include one fast “first action” the manager can do today.
  - Keep tips realistic and time-bound.

  Guidelines:
  - Audience is the manager; keep it concise, direct, and actionable.
  - Use only the provided data; do not invent numbers.
  - Avoid jargon; be specific about actions.
  </task>

  Write all three sections now for the manager. Be specific and actionable.
  `;

    const response = await generateWithRetry(genAI, {
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    res.json({ success: true, data: response.text });
  } catch (error) {
    console.error('AI Error:', error);
    const status = error?.response?.status || error?.status;
    if (status === 503) {
      return res.status(503).json({ success: false, message: 'AI service is busy. Please retry in a few seconds.' });
    }
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

    const response = await generateWithRetry(genAI, {
      model: "gemini-3-flash-preview",
      contents: contents
    });

    res.json({ success: true, data: response.text });
  } catch (error) {
    console.error('AI Chat Error:', error);
    const status = error?.response?.status || error?.status;
    if (status === 503) {
      return res.status(503).json({ success: false, message: 'AI service is busy. Please retry in a few seconds.' });
    }
    res.status(500).json({ success: false, message: 'Chat failed', error: error.message });
  }
};
