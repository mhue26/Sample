import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { redirect } from "next/navigation";
import ProfileEditClient from "./ProfileEditClient";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/signin");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-lg shadow-xl border max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Edit Profile</h1>
          <ProfileEditClient user={session.user} />
        </div>
      </div>
    </div>
  );
}
