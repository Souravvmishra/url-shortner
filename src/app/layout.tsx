import type { Metadata } from "next";
import "./globals.css";
import { FirebaseProvider } from "@/context/firebaseProvider";
import { Toaster } from "sonner";


export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans antialiased`}
      >
        <FirebaseProvider>

          {children}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}