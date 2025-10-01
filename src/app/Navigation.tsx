"use client";

import { usePathname } from "next/navigation";
import SignOutButton from "./SignOutButton";

interface NavigationProps {
  session: any;
}

export default function Navigation({ session }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="text-sm flex items-center gap-2">
      {session ? (
        <>
          <a 
            href="/dashboard" 
            className={`hover:underline ${pathname === "/dashboard" ? "underline" : ""}`}
          >
            Dashboard
          </a>
          <span className="px-2">·</span>
          <a 
            href="/students" 
            className={`hover:underline ${pathname.startsWith("/students") ? "underline" : ""}`}
          >
            Students
          </a>
          <span className="px-2">·</span>
          <a 
            href="/calendar" 
            className={`hover:underline ${pathname.startsWith("/calendar") ? "underline" : ""}`}
          >
            Calendar
          </a>
          <span className="px-2">·</span>
          <a 
            href="/billing" 
            className={`hover:underline ${pathname.startsWith("/billing") ? "underline" : ""}`}
          >
            Invoicing
          </a>
          <span className="px-2">·</span>
        </>
      ) : null}
      {!session ? (
        <div className="flex items-center gap-2">
          <a href="/about" className="hover:underline">About us</a>
          <span className="px-2">·</span>
          <a href="/signin" className="rounded-md border px-3 py-1.5 hover:bg-gray-50">Log in</a>
          <a href="/signup" className="rounded-md bg-blue-600 text-white px-3 py-1.5 hover:bg-blue-700">Sign up</a>
        </div>
      ) : (
        <div className="rounded-md border px-3 py-1.5">
          <SignOutButton />
        </div>
      )}
    </nav>
  );
}
