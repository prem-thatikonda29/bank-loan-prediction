import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { LoanCalculator } from "@/components/LoanCalculator";
import { FeatureImportance } from "@/components/FeatureImportance";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Hero />
      <StatsBar />
      <LoanCalculator />
      <FeatureImportance />
      <Footer />
    </main>
  );
}
