import MobileNavbar from "@/components/ui/MobileNavBar";
import Sidebar from "@/components/ui/Sidebar";
import { getServerUser } from "@/lib/actions/user.server.actions"; 
import Image from 'next/image';
import { redirect } from "next/navigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getServerUser(); 

  if(!loggedIn) redirect('/sign-in');

  return (
    <main className="flex h-screen w-full font-inter">
        <Sidebar user={loggedIn}/>
        <div className="flex size-full flex-col">
          <div className="root-layout">
            <Image src="/icons/logo.svg" width={30} height={30} alt="menu icon"/>
          <div>
          <MobileNavbar user={loggedIn}/>
          </div>
          </div>
          {children}
        </div>
    </main>
  );
}