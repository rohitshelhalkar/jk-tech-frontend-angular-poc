# User Document Management System - Frontend

A modern Angular frontend application for document management with AI-powered Q&A capabilities, built with Angular 17+ and Angular Material.

## 🚀 Features

### Core Functionality
- **User Authentication** - JWT-based authentication with role-based access control
- **Document Management** - Upload, view, download, and delete documents (PDF, DOCX, TXT)
- **User Management** - Admin-only user CRUD operations with role management
- **Document Processing** - Trigger and monitor document ingestion jobs
- **AI Q&A Interface** - Query documents using RAG (Retrieval-Augmented Generation)
- **Real-time Updates** - Live status updates for document processing

### User Roles
- **Admin** - Full system access, user management, all document operations
- **Editor** - Document management, ingestion triggers, Q&A access
- **Viewer** - View own documents, download files, Q&A interface

### Technical Features
- **Responsive Design** - Mobile-first approach with Angular Material
- **Modern Angular** - Built with Angular 17+ and standalone components
- **TypeScript** - Strict type checking and modern JavaScript features
- **HTTP Interceptors** - JWT token injection and global error handling
- **Route Guards** - Authentication and role-based access protection
- **File Upload** - Drag & drop interface with progress tracking
- **Data Export** - CSV export functionality for users and documents

## 📋 Prerequisites

- Node.js 18+ and npm
- Angular CLI 17+
- Backend API running (NestJS Document Management System)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jk_tech_frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   Update `src/environments/environment.ts` with your backend API URL:
   ```typescript
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000/api',
     tokenKey: 'jk_tech_token',
     refreshTokenKey: 'jk_tech_refresh_token'
   };
   ```

4. **Start development server**
   ```bash
   ng serve
   ```

5. **Open browser**
   Navigate to `http://localhost:4200`

## 🏗️ Project Structure

```
src/
├── app/
│   ├── core/                     # Core functionality
│   │   ├── guards/              # Route guards
│   │   ├── interceptors/        # HTTP interceptors
│   │   ├── models/              # TypeScript interfaces
│   │   └── services/            # Business logic services
│   ├── features/                # Feature modules
│   │   ├── auth/               # Authentication (login/register)
│   │   ├── dashboard/          # Main dashboard
│   │   ├── documents/          # Document management
│   │   ├── users/              # User management (Admin only)
│   │   ├── ingestion/          # Processing jobs monitoring
│   │   └── qa/                 # Q&A interface
│   ├── shared/                 # Shared components
│   │   └── components/         # Reusable UI components
│   ├── app.component.*         # Root component
│   ├── app.config.ts           # App configuration
│   └── app.routes.ts           # Route definitions
├── environments/               # Environment configurations
└── assets/                    # Static assets
```

## 🎯 Available Scripts

- `ng serve` - Start development server
- `ng build` - Build for production
- `ng test` - Run unit tests
- `ng e2e` - Run end-to-end tests
- `ng lint` - Run linting
- `ng generate` - Generate new components/services

## 🔐 Authentication

### Demo Credentials
For testing purposes, use these demo credentials:

- **Admin**: `admin@example.com` / `Admin@1234$`
- **Editor**: `editor@example.com` / `Editor@1234$`  
- **Viewer**: `viewer@example.com` / `Viewer@1234$`

### JWT Token Management
- Tokens are stored in localStorage
- Automatic token refresh on API calls
- Secure logout with token cleanup
- Route protection based on authentication status

## 📱 User Interface

### Components Overview
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Angular Material** - Consistent Material Design components
- **Dark/Light Theme** - Follows system preferences
- **Accessibility** - WCAG compliant with proper ARIA labels

### Key Pages
1. **Login/Register** - User authentication with form validation
2. **Dashboard** - Role-based overview with quick actions and statistics
3. **Documents** - File management with upload, download, and filtering
4. **Users** - Admin-only user management with CRUD operations
5. **Ingestion Jobs** - Monitor document processing status
6. **Q&A Interface** - Query documents using AI

## 🔄 API Integration

### Backend Requirements
The frontend expects a REST API with the following endpoints:

```typescript
// Authentication
POST /auth/login          # User login
POST /auth/register       # User registration
POST /auth/refresh        # Token refresh

// Users (Admin only)
GET    /users             # List users
POST   /users             # Create user
PUT    /users/:id         # Update user
DELETE /users/:id         # Delete user

// Documents
GET    /documents         # List user documents
POST   /documents/upload  # Upload document
GET    /documents/:id/download # Download document
DELETE /documents/:id     # Delete document
POST   /documents/:id/ingest   # Trigger processing

// Ingestion Jobs
GET    /ingestion/jobs    # List processing jobs
GET    /ingestion/jobs/:id # Get job details

// Q&A
POST   /qa/query          # Submit question
GET    /qa/history        # Get query history
```

### Error Handling
- Global HTTP error interceptor
- User-friendly error messages
- Automatic retry for failed requests
- Network connectivity handling

## 🧪 Testing

### Unit Tests (Jasmine/Karma)
```bash
ng test
```

### End-to-End Tests (Cypress)
```bash
ng e2e
```

### Test Coverage
- Services: Business logic and API interactions
- Components: User interactions and rendering
- Guards: Route protection logic
- Interceptors: HTTP request/response handling

## 📦 Build & Deployment

### Development Build
```bash
ng build
```

### Production Build
```bash
ng build --configuration production
```

### Build Optimization
- Tree shaking for smaller bundle size
- Lazy loading for feature modules
- Service workers for caching (optional)
- AOT compilation for better performance

## 🔧 Configuration

### Environment Variables
- `apiUrl` - Backend API base URL
- `tokenKey` - localStorage key for JWT token
- `refreshTokenKey` - localStorage key for refresh token
- `production` - Production mode flag

### Angular Material Theme
Customize the theme in `src/styles.scss`:
```scss
@import '~@angular/material/prebuilt-themes/purple-green.css';
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure backend allows frontend origin
   - Check API URL in environment configuration

2. **Authentication Issues**
   - Clear localStorage tokens
   - Verify backend JWT configuration
   - Check token expiration times

3. **File Upload Failures**
   - Verify file size limits (max 10MB)
   - Check supported file types (PDF, DOCX, TXT)
   - Ensure backend upload endpoint is working

4. **Build Errors**
   - Clear node_modules and reinstall
   - Update Angular CLI to latest version
   - Check TypeScript compatibility

## 📈 Performance Optimization

- **Lazy Loading** - Feature modules loaded on demand
- **OnPush Strategy** - Optimized change detection
- **TrackBy Functions** - Efficient list rendering
- **HTTP Caching** - Cached API responses
- **Bundle Analysis** - Use `ng build --stats-json` and webpack-bundle-analyzer

## 🔒 Security Considerations

- **JWT Storage** - Tokens stored in localStorage (consider httpOnly cookies for production)
- **Route Guards** - Prevent unauthorized access
- **Input Validation** - Client and server-side validation
- **XSS Protection** - Angular's built-in sanitization
- **CSRF Protection** - Implement CSRF tokens if needed


**Built with ❤️ using Angular 17+ and Angular Material**