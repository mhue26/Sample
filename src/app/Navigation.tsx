"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';

interface NavigationProps {
  session: any;
}

export default function Navigation({ session }: NavigationProps) {
  const pathname = usePathname();

  // Keep the home page minimal; app navigation lives in the sidebar after login.
  if (pathname === "/") {
    return null;
  }
  
  return (
    <nav className="text-base flex items-center justify-center gap-2">
      {session ? (
        <>
          <Link href="/dashboard" className={pathname === '/dashboard' ? 'font-bold' : 'hover:font-bold'} style={{ color: '#584B53' }}>Dashboard</Link>
          <span className="px-2">·</span>
          <Link href="/students" className={pathname?.startsWith('/students') ? 'font-bold' : 'hover:font-bold'} style={{ color: '#584B53' }}>Students</Link>
          <span className="px-2">·</span>
          <Link href="/classes" className={pathname?.startsWith('/classes') ? 'font-bold' : 'hover:font-bold'} style={{ color: '#584B53' }}>Classes</Link>
          <span className="px-2">·</span>
          <Link href="/calendar" className={pathname === '/calendar' ? 'font-bold' : 'hover:font-bold'} style={{ color: '#584B53' }}>Calendar</Link>
          <span className="px-2">·</span>
          <Link href="/billing" className={pathname?.startsWith('/billing') ? 'font-bold' : 'hover:font-bold'} style={{ color: '#584B53' }}>Billing</Link>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <Link href="/about" className="hover:font-bold" style={{ color: '#584B53' }}>About</Link>
          <span className="px-2">·</span>
          <Link href="/contact" className="hover:font-bold" style={{ color: '#584B53' }}>Contact</Link>
        </div>
      )}
    </nav>
  );
}
