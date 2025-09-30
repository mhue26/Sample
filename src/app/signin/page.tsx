import { authOptions } from "@/utils/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import SignInForm from "./SignInForm";

export default async function SignInPage() {
    const session = await getServerSession(authOptions);
    if (session?.user) redirect("/students");
    return <SignInForm />;
}


