import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { SubmitButton } from "@/components/submit-button";
import { logout } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-8">
      <div className="mb-6 flex items-center gap-4">
        <AdminNav />
        <form action={logout} className="ml-auto">
          <SubmitButton className="btn-ghost">Sign out</SubmitButton>
        </form>
      </div>
      {children}
    </div>
  );
}
