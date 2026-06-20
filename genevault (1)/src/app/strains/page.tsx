import Link from 'next/link';

export default async function StrainsPage() {
  // Placeholder for strains listing. In the future this will fetch data from Supabase.
  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Strains</h1>
      <p className="mb-4 text-gray-300">
        This section will list all strains in your database. Each entry will show its name,
        breeder, classification, and offer quick actions to view, edit, or delete.
      </p>
      <div className="flex gap-4 mb-8">
        <Link
          href="/strains/new"
          className="px-4 py-2 bg-primary-dark text-white rounded hover:bg-primary light"
        >
          Add New Strain
        </Link>
        {/* Additional controls like search and filters will be added here */}
      </div>
      {/* Data table or card layout for strains will be inserted here */}
      <div className="rounded-lg bg-gray-800 p-4 text-gray-400">
        No strains found. Start by adding your first strain.
      </div>
    </section>
  );
}