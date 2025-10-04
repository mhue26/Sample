import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

async function createClass(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin");
  }

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const color = String(formData.get("color") || "#3B82F6").trim();

  await prisma.class.create({
    data: {
      name,
      description,
      color,
      userId: (session.user as any).id,
    },
  });

  redirect("/classes");
}

export default function NewClassPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/classes"
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back to Classes
        </Link>
        <h1 className="text-2xl font-semibold">Create New Class</h1>
      </div>

      <div className="bg-white rounded-lg border p-6">
        <form action={createClass} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Class Name</label>
            <input 
              name="name" 
              type="text" 
              required
              className="w-full border rounded-md px-3 py-2" 
              placeholder="Enter class name"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Description (Optional)</label>
            <textarea 
              name="description" 
              rows={3}
              className="w-full border rounded-md px-3 py-2" 
              placeholder="Enter class description"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Color</label>
            <div className="flex gap-2">
              {[
                { name: "Blue", value: "#3B82F6" },
                { name: "Green", value: "#10B981" },
                { name: "Purple", value: "#8B5CF6" },
                { name: "Pink", value: "#EC4899" },
                { name: "Orange", value: "#F59E0B" },
                { name: "Red", value: "#EF4444" },
              ].map((color) => (
                <label key={color.value} className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="color" 
                    value={color.value}
                    defaultChecked={color.value === "#3B82F6"}
                    className="sr-only"
                  />
                  <div 
                    className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors"
                    style={{ backgroundColor: color.value }}
                  ></div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button 
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Class
            </button>
            <Link 
              href="/classes"
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
