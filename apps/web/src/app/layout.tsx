import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Onusandhan AI | Academic Research Portal",
  description: "Production-ready academic research portal, submission Desk, and double-blind peer review workstation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 min-h-screen flex flex-col">
        <AuthProvider>
          <LanguageProvider>
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
                <div>
                  © {new Date().getFullYear()} Onusandhan AI. All rights reserved.
                </div>
                <div className="flex gap-4">
                  <a href="#" className="hover:text-indigo-600 transition-colors">Academic Guidelines</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
                </div>
              </div>
            </footer>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
