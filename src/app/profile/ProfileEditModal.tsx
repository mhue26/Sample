"use client";

import { useModal } from "../contexts/ModalContext";
import ProfileEditClient from "./ProfileEditClient";
import { useEffect } from "react";

interface ProfileEditModalProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export default function ProfileEditModal({ user }: ProfileEditModalProps) {
  const { isModalOpen, setIsModalOpen } = useModal();

  // Close on ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setIsModalOpen]);

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center backdrop-blur-sm overflow-hidden">
      {/* Click outside to close */}
      <div
        className="absolute inset-0"
        onClick={() => setIsModalOpen(false)}
      />

      <div className="relative bg-white rounded-lg shadow-xl border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Edit Profile</h1>
            <button
              onClick={() => setIsModalOpen(false)}
              aria-label="Close"
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <ProfileEditClient user={user} />
        </div>
      </div>
    </div>
  );
}


