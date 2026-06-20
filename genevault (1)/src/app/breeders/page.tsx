import Link from 'next/link';

export default async function BreedersPage() {
  // Placeholder for breeders listing.
  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Breeders</h1>
      <p className="mb-4 text-gray-300">
        Manage breeders and their associated information here. Create new breeders and
        edit existing records.
      </p>
      <div className="flex gap-4 mb-8">
        <Link
          href="/breeders/new"
          className="px-4 py-2 bg-primary-dark text-white rounded hover:bg-primary-light"
        >
          Add New Breeder
        </Link>
      </div>
      <div className="rounded-lg bg-gray-800 p-4 text-gray-400">
        No breeders found. Start by adding a breeder.
      </div>
    </section>
  );
}