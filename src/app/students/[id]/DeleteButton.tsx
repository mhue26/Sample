"use client";

import { useRouter } from "next/navigation";

interface DeleteButtonProps {
  studentId: number;
  deleteAction: (id: number) => Promise<void>;
}

export default function DeleteButton({ studentId, deleteAction }: DeleteButtonProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
      return;
    }
    
    try {
      await deleteAction(studentId);
      router.push('/students');
    } catch (error) {
      console.error('Failed to delete student:', error);
    }
  };

  return (
    <button 
      type="button"
      onClick={handleDelete}
      className="rounded-md bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700"
    >
      Delete Student
    </button>
  );
}
