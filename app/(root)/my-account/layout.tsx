import { getServerUser } from '@/lib/actions/user.server.actions';
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getServerUser();

  if (!loggedIn) redirect('/sign-in');

  return (
    <main className="flex h-screen w-full font-inter">
      <div className="flex size-full flex-col">
        {children}
      </div>
    </main>
  );
}
