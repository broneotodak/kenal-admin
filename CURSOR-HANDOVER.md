# Cursor AI Handover Document

## Project Context
This is the Kenal Admin Dashboard - an admin panel for kenal.com (personality analysis platform).

## Current State
- **Status**: MVP Complete, ready for enhancements
- **Last Updated**: June 18, 2025
- **Previous AI**: Claude (ClaudeN)

## Important Notes

### 1. Supabase Configuration
- **Project**: KENAL (etkuxatycjqwvfjjwxqm)
- **Owner**: Lan Todak
- **RLS**: DISABLED (no Row Level Security)
- **DO NOT**: Modify Supabase settings without permission

### 2. Common Issues & Solutions

#### Data Not Loading
1. Check browser console for JavaScript errors first
2. Verify authentication status
3. Use `/diagnose-kenal` page for debugging
4. RLS is NOT enabled, so it's not an RLS issue

#### Build Errors
```bash
# Clean build cache
rm -rf .next
rm -rf node_modules
npm install
npm run dev
```

### 3. Key Features Implemented
- ✅ Authentication (admin only, user_type = 5)
- ✅ Dashboard with charts (Chart.js + zoom plugin)
- ✅ User management with filters
- ✅ Dark/Light theme
- ✅ Mobile responsive
- ✅ Auto-refresh (30 seconds)

### 4. Next Steps / TODO
1. Fix TypeScript strict mode issues
2. Implement remaining pages (Analytics, Content, Feedback, Settings)
3. Add export functionality for users
4. Deploy to admin.kenal.com
5. Add more chart types to dashboard
6. Implement real-time updates

### 5. File Structure Notes
- Main layout: `/src/components/DashboardLayout.tsx`
- Auth logic: `/src/app/(auth)/login/page.tsx`
- Protected routes: `/src/app/(protected)/`
- Supabase client: `/src/lib/supabase.ts`

### 6. Environment Variables
Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://etkuxatycjqwvfjjwxqm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[get from Supabase dashboard]
SUPABASE_SERVICE_ROLE_KEY=[optional, for server-side]
```

### 7. Design Reference
- Match kenal.com design
- Primary color: #1e3a8a (blue)
- Use Material-UI components
- Keep consistent with existing patterns

### 8. Testing Accounts
- neo@todak.com (password in Supabase)
- lan@todak.com

### 9. Deployment
- Target: Netlify
- Domain: admin.kenal.com
- Build command: `npm run build`
- Publish directory: `.next`

### 10. Database Notes
- Tables: kd_users, kd_identity
- Foreign key: kd_identity.user_id -> kd_users.id
- Join syntax: `kd_identity!kd_identity_user_id_fkey`

## Quick Start for Cursor
1. Open project in Cursor
2. Run `npm install`
3. Ensure `.env.local` exists
4. Run `npm run dev`
5. Login with admin account
6. Check http://localhost:3000/dashboard

## Contact
- Project Owner: Lan Todak
- Assistant: Neo Todak

Good luck! The project is in good shape, just needs some polish and feature completion.
