# Employee Management System - Frontend Only

A modern, responsive employee management dashboard built with React, TypeScript, and Tailwind CSS.

## 🎯 Overview

This is a **frontend-only** version of an employee management system. All data is stored in **localStorage** for demonstration purposes. You can easily integrate your own backend by replacing the mock data hooks.

## ✨ Features

- **Dashboard Overview**: View key metrics and statistics
- **Employee Management**: Add, edit, and manage employee profiles
- **Task Management**: Assign and track tasks
- **Performance Evaluations**: Conduct and store employee evaluations
- **Messaging System**: Internal communication between admin and employees
- **Meeting Scheduler**: Schedule and manage meetings
- **Attendance Tracking**: Monitor employee attendance
- **Mock Authentication**: Simple login/signup system using localStorage

## 🚀 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🔌 Backend Integration Points

This frontend is designed to be backend-agnostic. Here are the main integration points where you can connect your own backend:

### 1. Authentication (`src/contexts/AuthContext.tsx`)
Replace mock authentication with your backend API.

### 2. Data Hooks (All located in `src/hooks/`)
- `useProfiles.ts` - User profiles
- `useEmployees.ts` - Employee data
- `useTasks.ts` - Task management
- `useEvaluations.ts` - Performance evaluations
- `useMessages.ts` - Messaging system
- `useMeetings.ts` - Meeting scheduler
- `useAttendance.ts` - Attendance tracking

Each hook uses localStorage currently. Replace with your API calls.

## 🎨 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── admin/        # Admin-specific components
│   ├── auth/         # Authentication components
│   ├── employee/     # Employee-specific components
│   └── ui/          # Base UI components
├── contexts/         # React contexts
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── pages/           # Page components
└── types/           # TypeScript types
```

## 🔐 Mock Authentication

Create accounts via signup or use mock data.

## 📝 Notes

- All data is stored in **localStorage**
- Data persists across browser sessions
- No backend requests are made
- Perfect for demos and prototypes

## 🚧 Backend Integration Checklist

- [ ] Replace AuthContext with real authentication
- [ ] Replace all data hooks with API calls
- [ ] Add proper error handling
- [ ] Implement API client/service layer
- [ ] Set up environment variables
- [ ] Add request interceptors for auth tokens

## 📄 License

MIT License
