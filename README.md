# Kenal Admin Dashboard

## Overview
Admin dashboard for Kenal.com - A platform for personality analysis based on elements.

## Tech Stack
- **Frontend**: Next.js 14.2.3, TypeScript, Material-UI
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Netlify (planned)

## Project Status
✅ MVP Complete with:
- Authentication system (admin only)
- Dashboard with interactive charts
- User management
- Dark/Light theme support
- Mobile responsive

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase project access

### Installation
```bash
# Clone the repository
git clone [your-repo-url]
cd kenal-admin-next

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables
Create `.env.local` with:
```env
NEXT_PUBLIC_SUPABASE_URL=https://etkuxatycjqwvfjjwxqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### Development
```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start
```

## Project Structure
```
kenal-admin-next/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (protected)/
│   │   │   ├── dashboard/
│   │   │   ├── users/
│   │   │   └── [other pages]/
│   │   └── layout.tsx
│   ├── components/
│   │   └── DashboardLayout.tsx
│   ├── lib/
│   │   └── supabase.ts
│   └── theme/
├── public/
├── package.json
└── README.md
```

## Database Schema
- **kd_users**: User accounts
- **kd_identity**: User personality patterns
- Admin users have `user_type = 5`

## Known Issues
- Build warnings about module type (add `"type": "module"` to package.json if needed)
- Some TypeScript strict mode warnings

## Deployment
Target: admin.kenal.com (Netlify)

```bash
# Deploy to Netlify
netlify deploy --dir ./.next --prod
```

## Admin Users
- neo@todak.com
- lan@todak.com
- (see PROJECT-KENAL.md for full list)

## Documentation
- `/PROJECT-KENAL.md` - Main project documentation
- `/KENAL-ADMIN-HANDOVER.md` - Handover notes
- SQL files for database fixes

## Support
For issues with Supabase connection, check `/src/app/(protected)/diagnose-kenal`
