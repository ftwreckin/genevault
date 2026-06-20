import Link from 'next/link';

export default async function InventoryPage() {
  // Placeholder for inventory management.
  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Inventory</h1>
      <p className="mb-4 text-gray-300">
        Track your seed packs and clones here. Manage quantities, storage locations and
        notes for each item.
      </p>
      <div className="flex gap-4 mb-8">
        <Link
          href="/inventory/seeds/new"
          className="px-4 py-2 bg-primary-dark text-white rounded hover:bg-primary-light"
        >
          Add Seed Pack
        </Link>
        <Link
          href="/inventory/clones/new"
          className="px-4 py-2 bg-primary-dark text-white rounded hover:bg-primary-light"
        >
          Add Clone
        </Link>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-gray-800 p-4">
          <h2 className="text-xl font-semibold mb-2">Seed Inventory</h2>
          <p className="text-gray-400">No seed packs found. Start by adding a seed pack.</p>
        </div>
        <div className="rounded-lg bg-gray-800 p-4">
          <h2 className="text-xl font-semibold mb-2">Clone Inventory</h2>
          <p className="text-gray-400">No clones found. Start by adding a clone.</p>
        </div>
      </div>
    </section>
  );
}