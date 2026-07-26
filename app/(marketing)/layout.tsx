import { SiteHeader } from "@/components/site-header";

/** The public pages (landing, form hub, recommender, glossary) share one header. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
