import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="bg-gray-800 shadow">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="text-xl font-semibold text-primary-light">
          GeneVault
        </Link>
        <div className="space-x-4">
          <Link href="/" className="hover:text-primary-light transition-colors">
            Dashboard
          </Link>
          <Link href="/strains" className="hover:text-primary-light transition-colors">
            Strains
          </Link>
          <Link href="/breeders" className="hover:text-primary-light transition-colors">
            Breeders
          </Link>
          <Link href="/inventory" className="hover:text-primary-light transition-colors">
            Inventory
          </Link>
        </div>
      </nav>
    </header>
  );
}