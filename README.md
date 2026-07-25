# The Nutt Bank

The Nutt Bank is Dana Nutt's private, mobile-first cultivation genetics library.

The production app replaces the former GeneVault concept and is focused on four low-friction workflows:

- Search the live strain library and current plant counts
- Open a strain to view genetics, flavor notes, tags, photos, and quick notes
- Track current breeding projects
- Maintain seed inventory

## Current production stack

- Next.js 14
- Supabase Auth
- Supabase Postgres with Row-Level Security
- Supabase Storage for private strain photos
- Vercel hosting

The starter inventory contains 157 live strains and 1,473 current plants. Supabase project configuration is embedded using the browser-safe publishable key. The database schema must be installed once before first use.
