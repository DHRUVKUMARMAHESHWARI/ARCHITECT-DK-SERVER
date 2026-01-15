# ATS Architect Backend

Professional backend for ATS Architect Resume Builder.

## Features
- **Authentication**: JWT-based auth (Register, Login, Me).
- **Resume Management**: CRUD operations for resumes.
- **AI Integration**: Proxy for Google Gemini API to secure API keys.
- **Security**: Helmet, CORS, Rate Limiting, XSS protection.
- **Database**: MongoDB with Mongoose.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.example` to `.env` and fill in the values.
    ```bash
    cp .env.example .env
    ```
    Required:
    - `MONGO_URI`: Your MongoDB connection string.
    - `JWT_SECRET`: Secret for signing tokens.
    - `API_KEY`: Google Gemini API Key.

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Run Production Server**:
    ```bash
    npm start
    ```

## Docker

Build and run with Docker Compose:
```bash
docker-compose up --build
```

## API Endpoints

### Auth
- `POST /api/auth/register` - { name, email, password }
- `POST /api/auth/login` - { email, password }
- `GET /api/auth/me` - Get current user (Protected)

### Resumes
- `POST /api/resumes` - Create resume
- `GET /api/resumes` - List user resumes
- `GET /api/resumes/:id` - Get resume details
- `PUT /api/resumes/:id` - Update resume
- `DELETE /api/resumes/:id` - Delete resume

### AI (Protected/Public depending on config)
- `POST /api/ai/convert` - Convert file to HTML
- `POST /api/ai/text` - Convert text to HTML
- `POST /api/ai/improve` - Improve resume content
- `POST /api/ai/reorder` - Reorder sections
- `POST /api/ai/feedback` - Get ATS feedback
