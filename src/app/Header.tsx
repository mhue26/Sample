"use client";

import { useModal } from "./contexts/ModalContext";
import Navigation from "./Navigation";

interface HeaderProps {
  session: any;
}

export default function Header({ session }: HeaderProps) {
  const { isModalOpen } = useModal();

  return (
    <header className={`fixed top-4 left-4 right-4 z-[60] bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-lg transition-all duration-300 ${
      isModalOpen ? 'blur-sm' : ''
    }`}>
      <div className="w-full px-4 sm:px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-lg font-semibold hover:text-blue-600 transition-colors">
          Tutor Tools
        </a>
        <Navigation session={session} />
      </div>
    </header>
  );
}
