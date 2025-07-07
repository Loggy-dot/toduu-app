# ToDuu Backend API

A RESTful API backend for the ToDuu todo application built with Node.js, Express, and SQLite.

## Features

- User authentication (register/login) with JWT tokens
- CRUD operations for todos
- Todo filtering (all, active, completed)
- Priority levels (Low, Medium, High)
- Due dates
- Todo statistics
- SQLite database for data persistence

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   - The `.env` file is already created with default values
   - For production, change the `JWT_SECRET` to a secure random string

3. **Start the Server**
   ```bash
   # Development mode with auto-restart
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - API Base URL: http://localhost:3000/api

## API Endpoints

### Authentication

#### Register User
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```

#### Login User
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```

#### Get Current User
- **GET** `/api/auth/me`
- **Headers:** `Authorization: Bearer <token>`

### Todos

All todo endpoints require authentication via `Authorization: Bearer <token>` header.

#### Get All Todos
- **GET** `/api/todos`
- **Query Parameters:**
  - `filter`: `all` | `active` | `completed`

#### Create Todo
- **POST** `/api/todos`
- **Body:**
  ```json
  {
    "text": "string",
    "priority": "Low" | "Medium" | "High",
    "due_date": "YYYY-MM-DD"
  }
  ```

#### Update Todo
- **PUT** `/api/todos/:id`
- **Body:**
  ```json
  {
    "text": "string",
    "completed": boolean,
    "priority": "Low" | "Medium" | "High",
    "due_date": "YYYY-MM-DD"
  }
  ```

#### Delete Todo
- **DELETE** `/api/todos/:id`

#### Delete All Completed Todos
- **DELETE** `/api/todos/completed/all`

#### Get Todo Statistics
- **GET** `/api/todos/stats`

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email address
- `password` - Hashed password
- `created_at` - Timestamp

### Todos Table
- `id` - Primary key
- `user_id` - Foreign key to users table
- `text` - Todo description
- `completed` - Boolean completion status
- `priority` - Priority level (Low/Medium/High)
- `due_date` - Optional due date
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Frontend Integration

The backend serves your existing frontend files and provides API endpoints. Your frontend JavaScript will need to be updated to:

1. Make API calls to authenticate users
2. Store JWT tokens in localStorage
3. Include Authorization headers in API requests
4. Replace local todo array with API calls

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS enabled for cross-origin requests
- SQL injection protection with parameterized queries

## Error Handling

The API returns consistent error responses:
```json
{
  "error": "Error message",
  "errors": [/* validation errors array */]
}
```

## Development

- Database file is created automatically at `database/toduu.db`
- Use `npm run dev` for development with auto-restart
- Check console for server startup confirmation