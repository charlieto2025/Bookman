import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n-server";
import { setLocale } from "@/app/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bookman",
  description: "AI writing assistant for your novel's story bible and drafts",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale === "zh" ? "zh-Hant" : "en"} className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-100 text-zinc-900">
        <header className="border-b border-zinc-200/70 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              📖 Bookman
            </Link>
            <div className="flex gap-1 text-sm">
              <form action={setLocale}>
                <input type="hidden" name="locale" value="zh" />
                <button
                  type="submit"
                  className={`rounded-lg px-2.5 py-1 ${
                    locale === "zh" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  繁中
                </button>
              </form>
              <form action={setLocale}>
                <input type="hidden" name="locale" value="en" />
                <button
                  type="submit"
                  className={`rounded-lg px-2.5 py-1 ${
                    locale === "en" ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                  }`}
                >
                  EN
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
