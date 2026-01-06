# Christian Center

## Overview

Christian Center is a personal Christian worship and study companion web application. It provides a calm, focused space for Bible reading, hymn exploration, livestream notes, and spiritual practice. The app is designed as a mobile-first web application with no social features—purely private spiritual tools for individual use.

**Core Features:**
- Bible Reader with KJV translation, highlighting, and verse notes
- Hymnal Library with public domain hymns, search, and favorites
- Personal Library for saved verses, hymns, and notes
- Livestream Companion with note-taking
- Light/Dark theme support

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Component Library**: shadcn/ui (Radix UI primitives with custom styling)
- **Typography**: Crimson Pro (serif) for reading content, Inter (sans-serif) for UI
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ES modules)
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Authentication**: Replit Auth integration with OpenID Connect, Passport.js, and session management

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM
- **Session Storage**: PostgreSQL (connect-pg-simple)
- **Schema Location**: `shared/schema.ts` defines all database tables
- **Bible Data Source**: SQLite file (better-sqlite3) for importing KJV verses during seeding

### Key Design Patterns
- **Shared Types**: Database schemas in `shared/` directory are shared between frontend and backend
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`
- **Authentication Middleware**: `isAuthenticated` middleware protects user-specific routes
- **Data Seeding**: Bible and hymn data are seeded from external sources on server startup

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    pages/        # Page components (Bible, Hymns, Library, etc.)
    hooks/        # Custom React hooks
    lib/          # Utilities and providers
server/           # Express backend
  replit_integrations/  # Replit Auth integration
  seed/           # Database seeding scripts
shared/           # Shared types and schemas
  schema.ts       # Drizzle database schema
  models/         # Additional model definitions
```

## External Dependencies

### Database
- **PostgreSQL**: Primary data store (requires `DATABASE_URL` environment variable)
- **Drizzle ORM**: Database queries and schema management
- **Drizzle Kit**: Database migrations (`npm run db:push`)

### Authentication
- **Replit Auth**: OpenID Connect-based authentication
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **passport**: Authentication middleware

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)
- `REPL_ID`: Replit environment identifier

### Third-Party UI Libraries
- Radix UI primitives (dialogs, dropdowns, tooltips, etc.)
- Lucide React icons
- react-hook-form with Zod validation
- date-fns for date formatting

### Development Tools
- Vite dev server with HMR
- TypeScript for type checking
- Replit-specific Vite plugins for development experience