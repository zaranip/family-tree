# Family Tree

A web application for creating and managing your family tree. Designed with elderly users in mind, featuring large text, clear navigation, and intuitive workflows.

## Features

- **Interactive Family Tree Visualization** - View your entire family tree with zoom, pan, and navigation controls
- **Person Management** - Add family members with detailed information (required: name, birthday; optional: bio, photos, contact info)
- **Relationship Management** - Create complex family relationships including:
  - Biological, adoptive, step, and foster parents
  - Spouses, ex-spouses, partners
  - Full, half, step, and adopted siblings
- **Search & Filter** - Find family members by name, location, occupation, and more
- **Admin Dashboard** - Manage users, view activity logs, and restore deleted relationships
- **Elderly-Friendly Design** - Large fonts, high contrast, clear buttons, and simple navigation

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (with elderly-friendly defaults)
- **State Management**: React Query + Zustand
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Tree Visualization**: React Flow
- **Form Handling**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 20+
- A Supabase account (free tier works)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd family-tree
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings > API** and copy your:
   - Project URL
   - Anon (public) key

3. Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up the Database

1. Go to your Supabase project's **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy and paste the entire contents into the SQL Editor
4. Click **Run** to create all tables, functions, and policies

### 4. Set Up Storage (for photos)

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `photos`
3. Make it **public**
4. The storage policies are included in the migration file (commented out) - run them separately if needed

### 5. Make Yourself an Admin

After creating your account:

1. Go to **Table Editor > user_profiles** in Supabase
2. Find your user row
3. Change `role` from `member` to `admin`

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the app.

## Project Structure

```
family-tree/
├── src/
│   ├── components/
│   │   ├── common/       # Reusable UI components (Button, Input, Modal, etc.)
│   │   ├── layout/       # Layout components (Header, PageLayout)
│   │   └── tree/         # Family tree visualization components
│   ├── features/
│   │   ├── auth/         # Authentication context and components
│   │   ├── people/       # Person-related components
│   │   └── relationships/# Relationship management components
│   ├── hooks/            # Custom React hooks for data fetching
│   ├── lib/              # Supabase client and API functions
│   ├── pages/            # Page components
│   │   ├── Auth/         # Login, Register, etc.
│   │   └── People/       # People list, profile, etc.
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main app with routing
│   └── main.tsx          # Entry point
├── supabase/
│   └── migrations/       # Database schema SQL
└── public/               # Static assets
```

## Usage Guide

### For Family Members

1. **Sign Up** - Create an account with your email
2. **Add Yourself** - Go to "Add Person" and enter your information
3. **Add Relationships** - From your profile, add parents, siblings, spouse, and children
4. **Explore the Tree** - View the interactive family tree to see how everyone is connected

### For Admins (You)

1. Access the **Admin Dashboard** from the navigation menu
2. **Manage Users** - Promote trusted family members to admin or remove access
3. **View Activity** - See who added what and when
4. **Restore Deleted Relationships** - Family members can't delete relationships, only you can

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Add your environment variables in Vercel's project settings
4. Deploy!

### Environment Variables for Production

```env
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
```

## Future Enhancements

- [ ] Photo gallery with tagging
- [ ] Timeline view of family events
- [ ] Birthday reminders
- [ ] Export to PDF/GEDCOM
- [ ] Mobile apps (React Native)

## Contributing

This is a personal family project. Feel free to fork and adapt for your own family!

## License

MIT
