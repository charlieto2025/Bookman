import { cookies } from "next/headers";
import { dictFor, type Locale, type Dictionary } from "@/lib/i18n";

const COOKIE_NAME = "locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === "en" ? "en" : "zh";
}

export async function getDictionary(): Promise<{ locale: Locale; dict: Dictionary }> {
  const locale = await getLocale();
  return { locale, dict: dictFor(locale) };
}
