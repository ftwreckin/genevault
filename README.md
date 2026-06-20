# GeneVault

GeneVault is a cannabis genetics knowledge base and inventory management platform designed to help breeders, collectors and researchers organize, explore and visualize cannabis genetics. It provides a searchable library of strains and breeders, inventory tracking for seeds and clones, and lays the groundwork for rich features like lineage visualization and interactive landrace maps.

## Project Goals

* **Comprehensive Genetics Database:** Store detailed information about each strain, including lineage, breeder, landrace ancestry, terpene and cannabinoid profiles, and cultivation notes.
* **Inventory Tracking:** Manage your seed and clone collections with quantities, storage locations and acquisition details.
* **Scalable Architecture:** Built with Next.js and Supabase, the platform is ready to expand with features like interactive family trees, world maps and AI‑powered search.

## Tech Stack

This project uses the following technologies:

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Frontend     | Next.js 14, React, TypeScript                 |
| Styling      | Tailwind CSS                                  |
| Backend      | Supabase (PostgreSQL, Auth, Storage)          |
| Visualization| (Planned) React Flow for lineage trees, Leaflet for maps |
| Hosting      | Vercel (development server via `next dev`)    |

## Getting Started

> **Note:** This repository contains the source code and configuration for the GeneVault application. It does not include installed node modules or a configured Supabase project. Before running the app you will need to install dependencies and set up environment variables.

### Prerequisites

* **Node.js** ≥ 18 and **npm** ≥ 9.
* A **Supabase project** with the required tables (`strains`, `breeders`, `landraces`, `lineage_relationships`, `seed_inventory`, `clone_inventory`, `photos`, `tags`, `references`).
* Two environment variables available at runtime:
  * `NEXT_PUBLIC_SUPABASE_URL`: The URL of your Supabase instance.
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key.

### Installation

1. **Clone the repository**

   ```bash
   git clone <your-fork-url>
   cd genevault
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create an `.env.local` file** in the project root and add your Supabase credentials:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the application. You should see the dashboard page with zero counts if your Supabase tables are empty.

### Project Structure

```
genevault/
├── package.json        # Project dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── next.config.js      # Next.js configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
├── .eslintrc.json      # ESLint configuration
├── src/
│   ├── app/
│   │   ├── layout.tsx   # Application layout with NavBar
│   │   ├── page.tsx     # Dashboard page
│   │   ├── strains/     # Strain listing and editing pages (placeholder)
│   │   ├── breeders/    # Breeder listing and editing pages (placeholder)
│   │   └── inventory/   # Inventory management pages (placeholder)
│   ├── components/
│   │   └── NavBar.tsx   # Navigation bar component
│   ├── lib/
│   │   └── supabaseClient.ts # Supabase client initialization
│   └── app/globals.css  # Global styles (Tailwind)
└── README.md
```

### Next Steps

This code base establishes a foundation for your GeneVault project, but many features remain to be implemented. The following tasks are logical next steps:

* Build CRUD pages for strains, breeders, seed packs and clones that read and write data to Supabase tables.
* Implement lineage relationships and a basic tree visualization using React Flow.
* Create an admin authentication and authorization flow with Supabase Auth.
* Add search and filtering capabilities to listings.
* Design and implement the database schema in Supabase following the MVP requirements.
* Integrate a map component (e.g., Leaflet) for landrace origin visualization.
* Polish the UI and add components such as tables, forms and modal dialogs.

GeneVault's architecture allows for many extensions, including AI‑powered search, automated lineage analysis and collaboration features. With this scaffolding in place you have a solid starting point for building a comprehensive cannabis genetics platform.