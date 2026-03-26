"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Workspace {
  organisationId: string;
  role: string;
  organisationName: string;
  isPersonal: boolean;
}

interface SidebarProps {
  session: any;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({ session, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: sessionData, update: updateSession } = useSession();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspaceDropdownOpen, setWorkspaceDropdownOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState("");
  const workspaceDropdownRef = useRef<HTMLDivElement>(null);

  const currentOrgId = (sessionData?.user ?? session?.user) && (sessionData?.user as any)?.organisationId;
  const currentWorkspace = workspaces.find((w) => w.organisationId === currentOrgId);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetch("/api/me/workspaces")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setWorkspaces(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session?.user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceDropdownRef.current && !workspaceDropdownRef.current.contains(event.target as Node)) {
        setWorkspaceDropdownOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setWorkspaceDropdownOpen(false);
    }
    if (workspaceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [workspaceDropdownOpen]);

  const filteredWorkspaces = workspaces.filter((w) =>
    w.organisationName.toLowerCase().includes(workspaceSearch.toLowerCase().trim())
  );

  async function switchWorkspace(organisationId: string, role: string) {
    if (organisationId === currentOrgId) return;
    await updateSession?.({ organisationId, role });
    router.refresh();
  }

  const navItems = [
    { href: "/dashboard", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { href: "/students", label: "Students", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { href: "/classes", label: "Classes", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
    { href: "/calendar", label: "Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
    { href: "/billing", label: "Billing", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  const isActive = (href: string) => {
    return pathname?.startsWith(href);
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="w-8 h-full bg-white border-r border-gray-200 z-40 hover:bg-gray-50 transition-colors flex items-center justify-center"
        aria-label="Show sidebar"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    );
  }

  return (
    <aside className="w-64 h-full min-h-0 flex flex-col bg-white border-r border-gray-200 shadow-sm relative" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      {/* Hide sidebar - left-facing arrow on right edge */}
      <button
        onClick={onToggle}
        className="absolute right-0 top-0 bottom-0 w-8 bg-white z-10 hover:bg-gray-50 transition-colors flex items-center justify-center"
        aria-label="Hide sidebar"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex flex-col h-full min-h-0 flex-1">
        {/* Main navigation - scrolls if content is tall so Workspaces stays visible.
            pr-10 clears the absolute hide-sidebar rail (w-8) so nav + workspace row aren’t obscured. */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 pr-10">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-[#EFFAFF] text-[#3D4756] border-l-2 border-[#3D4756]"
                    : "text-[#A1ACBD] hover:bg-gray-50"
                }`}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Workspaces dropdown at bottom - always visible, does not scroll away */}
        <div
          className="flex-shrink-0 p-4 pr-10 border-t border-gray-200 overflow-visible"
          ref={workspaceDropdownRef}
        >
          <p className="text-xs font-semibold tracking-wide text-gray-500 uppercase px-1 mb-2">
            Workspaces
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setWorkspaceDropdownOpen((o) => !o)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors border bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 text-[#3D4756]"
              style={workspaceDropdownOpen ? { backgroundColor: "#FEF5eF", borderColor: "#E4BB97" } : undefined}
              aria-expanded={workspaceDropdownOpen}
              aria-haspopup="listbox"
            >
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="flex-1 truncate" title={currentWorkspace?.organisationName}>
                {currentWorkspace?.organisationName ?? "Select workspace"}
              </span>
              <svg
                className={`h-4 w-4 flex-shrink-0 text-[#3D4756] transition-transform ${workspaceDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {workspaceDropdownOpen && (
              <div
                className="absolute left-0 right-0 bottom-full mb-2 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden z-20"
                role="listbox"
              >
                <div className="p-2 border-b border-gray-100">
                  <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={workspaceSearch}
                      onChange={(e) => setWorkspaceSearch(e.target.value)}
                      placeholder="Search for a workspace"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="py-1 max-h-56 overflow-y-auto">
                  <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    My workspaces
                  </p>
                  {filteredWorkspaces.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-gray-500">No workspaces match your search.</p>
                  ) : (
                    filteredWorkspaces.map((w) => {
                      const isCurrent = w.organisationId === currentOrgId;
                      return (
                        <button
                          key={w.organisationId}
                          type="button"
                          role="option"
                          aria-selected={isCurrent}
                          onClick={() => {
                            switchWorkspace(w.organisationId, w.role);
                            setWorkspaceDropdownOpen(false);
                            setWorkspaceSearch("");
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                            isCurrent
                              ? "bg-[#EFFAFF] text-[#3D4756]"
                              : "text-[#A1ACBD] hover:bg-gray-50"
                          }`}
                        >
                          <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="truncate">{w.organisationName}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}