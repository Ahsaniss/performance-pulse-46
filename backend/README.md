# Employee Management System - Backend API

Complete Node.js + Express + MongoDB backend for the Employee Management System.

## 🚀 Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **User Management**: Complete CRUD for employees
- **Task Management**: Create, assign, and track tasks
- **Messages**: Send individual or broadcast messages
- **Meetings**: Schedule and manage meetings
- **Evaluations**: Employee performance evaluations
- **Attendance**: Track employee attendance records
- **Authorization**: Role-based access control (Admin/Employee)

## 📦 Installation

```bash
cd backend
npm install
```

## ⚙️ Configuration

1. Create `.env` file in the backend root:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/employee_management?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:5173
```

2. **MongoDB Atlas Setup**:
   - Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Create a new cluster
   - Click "Connect" → "Connect your application"
   - Copy the connection string to `MONGO_URI`
   - Replace `<password>` with your database user password

## 🏃‍♂️ Running the Server

### Development Mode (with auto-restart):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

Server will run on `http://localhost:5000`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Employees
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create employee (admin only)
- `PUT /api/employees/:id` - Update employee (admin only)
- `DELETE /api/employees/:id` - Delete employee (admin only)

### Tasks
- `GET /api/tasks` - Get all tasks (filter by `?employeeId=xxx`)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create task (admin only)
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task (admin only)

### Messages
- `GET /api/messages` - Get messages (filter by `?userId=xxx`)
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read
- `DELETE /api/messages/:id` - Delete message

### Meetings
- `GET /api/meetings` - Get meetings (filter by `?userId=xxx`)
- `GET /api/meetings/:id` - Get single meeting
- `POST /api/meetings` - Create meeting (admin only)
- `PUT /api/meetings/:id` - Update meeting (admin only)
- `DELETE /api/meetings/:id` - Delete meeting (admin only)

### Evaluations
- `GET /api/evaluations` - Get evaluations (filter by `?employeeId=xxx`)
- `GET /api/evaluations/:id` - Get single evaluation
- `POST /api/evaluations` - Create evaluation (admin only)
- `PUT /api/evaluations/:id` - Update evaluation (admin only)
- `DELETE /api/evaluations/:id` - Delete evaluation (admin only)

### Attendance
- `GET /api/attendance` - Get attendance (filter by `?employeeId=xxx`)
- `GET /api/attendance/:id` - Get single record
- `POST /api/attendance` - Create record
- `PUT /api/attendance/:id` - Update record
- `DELETE /api/attendance/:id` - Delete record (admin only)

## 🔐 Authentication

Include JWT token in request headers:
```
Authorization: Bearer <your_jwt_token>
```

## 🌐 Deployment

### Railway
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Render
1. Push code to GitHub
2. Connect repository on [render.com](https://render.com)
3. Add environment variables
4. Deploy

### Heroku
```bash
heroku login
heroku create your-app-name
git push heroku main
heroku config:set MONGO_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── models/                # Mongoose schemas
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Message.js
│   │   ├── Meeting.js
│   │   ├── Evaluation.js
│   │   └── Attendance.js
│   ├── controllers/           # Business logic
│   ├── routes/                # API routes
│   └── middleware/
│       └── auth.js            # JWT authentication
├── server.js                  # Entry point
├── package.json
└── .env.example
```

## 🧪 Testing API

Use [Postman](https://www.postman.com/) or [Thunder Client](https://www.thunderclient.com/) to test endpoints.

### Example: Register User
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123",
  "name": "Admin User",
  "role": "admin"
}
```

### Example: Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Response includes JWT token - use it in subsequent requests.

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation with Mongoose
- CORS protection
- Environment variable protection

## 📝 License

ISC
