import { PosterSlides } from "@/components/poster-slides";
import { HomeDiscovery } from "@/components/home-discovery";
import { HomeCityLinksFooter } from "@/components/home-city-links-footer";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <PosterSlides />
      <HomeDiscovery />
      <HomeCityLinksFooter />
    </main>
  );
}
