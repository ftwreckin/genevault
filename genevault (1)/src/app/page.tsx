import { supabase } from '@/lib/supabaseClient';

async function fetchCount(table: string): Promise<number> {
  try {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    return count ?? 0;
  } catch (error) {
    console.error(`Error fetching count for ${table}:`, error);
    return 0;
  }
}

export default async function Dashboard() {
  // Fetch counts server-side. When Supabase is not configured the count will return 0.
  const [strainCount, breederCount, seedCount, cloneCount] = await Promise.all([
    fetchCount('strains'),
    fetchCount('breeders'),
    fetchCount('seed_inventory'),
    fetchCount('clone_inventory'),
  ]);

  const stats = [
    { name: 'Total Strains', value: strainCount },
    { name: 'Total Breeders', value: breederCount },
    { name: 'Total Seed Packs', value: seedCount },
    { name: 'Total Clones', value: cloneCount },
  ];

  return (
    <section>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-lg bg-gray-800 p-4 shadow hover:shadow-lg transition-shadow"
          >
            <p className="text-sm text-gray-400">{stat.name}</p>
            <p className="text-2xl font-semibold text-primary-light">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}