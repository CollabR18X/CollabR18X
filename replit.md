# CollabR18X

## Overview

CollabR18X is a creator collaboration platform with dating-style matching features. It enables content creators to discover each other, connect through likes/matches, chat via messaging, and manage collaboration requests. The application provides a directory of creator profiles, a collaboration request system with status tracking, and personalized dashboards for managing connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (January 2026)

- **Database Schema Extended**: Added full dating app functionality including likes, matches, messages, blocks, and reports tables
- **Profile Enhancements**: Added NSFW tagging option, profile visibility toggle, and dating-specific fields (interests, gender, looking for, preferences)
- **Auto-Save Feature**: Profile changes now save automatically with 2-second debounce, only sending changed fields
- **Dating Features Backend**: Full API support for likes, mutual matching, messaging, blocking, and reporting users

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom theme configuration supporting light/dark modes
- **Animations**: Framer Motion for landing page and modal animations
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for request/response validation
- **Build System**: Custom build script using esbuild for server bundling and Vite for client

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema-to-validation integration
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push` command

### Authentication
- **Provider**: Replit Auth via OpenID Connect (OIDC)
- **Session Storage**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Implementation**: Located in `server/replit_integrations/auth/` directory
- **User Management**: Automatic user upsert on authentication with profile creation flow

### Key Data Models
- **Users**: Core identity table managed by Replit Auth
- **Profiles**: Extended creator information including:
  - Basic info (bio, niche, portfolio, social links, location)
  - Dating fields (birthDate, gender, lookingFor, interests, relationshipType, height, occupation, education, photos)
  - Preferences (minAgePreference, maxAgePreference, maxDistance, genderPreference)
  - Settings (isNsfw, isVisible, ageVerified, socialsVerified)
- **Likes**: User like/super-like tracking with mutual match detection
- **Matches**: Matched user pairs for messaging
- **Messages**: Chat messages between matched users
- **Blocks**: User blocking for safety
- **Reports**: User reporting system for moderation
- **Collaborations**: Request system with status tracking (pending, accepted, rejected)

### API Structure
All API routes are prefixed with `/api/` and defined in `shared/routes.ts`:
- `/api/profiles/*` - Profile CRUD operations and discovery
- `/api/likes/*` - Like/pass actions
- `/api/matches/*` - Match management and messaging
- `/api/blocks/*` - Block/unblock users
- `/api/reports` - Report users
- `/api/collaborations/*` - Collaboration request management
- `/api/auth/*` - Authentication endpoints

### Project Structure
```
client/           # React frontend application
  src/
    components/   # Reusable UI components
    hooks/        # Custom React hooks for data fetching
    pages/        # Route page components
    lib/          # Utilities and query client
server/           # Express backend
  storage.ts      # Database storage operations
  routes.ts       # API route handlers
  replit_integrations/auth/  # Replit Auth integration
shared/           # Shared types, schemas, and route definitions
  models/         # Database model definitions
  schema.ts       # Drizzle table schemas
  routes.ts       # API route type definitions
```

## External Dependencies

### Database
- PostgreSQL database (connection via `DATABASE_URL` environment variable)
- Session table for authentication persistence
- User and application data tables

### Authentication Service
- Replit OIDC provider (`ISSUER_URL` defaults to `https://replit.com/oidc`)
- Requires `SESSION_SECRET` environment variable
- Requires `REPL_ID` environment variable (auto-provided in Replit)

### Third-Party UI Libraries
- Radix UI primitives for accessible component foundations
- Embla Carousel for carousel functionality
- Vaul for drawer components
- CMDK for command palette
- date-fns for date formatting

### Development Tools
- Replit-specific Vite plugins for development experience (cartographer, dev-banner, runtime-error-modal)
