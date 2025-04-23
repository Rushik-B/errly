import React from "react";
import NavBar from "@/components/NavBar";
import HeroScreenshotSection from "@/components/HeroScreenshotSection";
import HeroSection from "@/components/HeroSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import FooterLuxury from "@/components/FooterLuxury";

const Index = () => {
  return (
    <main className="min-h-screen bg-[#101018] overflow-x-hidden relative font-sans">
      <NavBar />
      <HeroScreenshotSection />
      <HeroSection />
      <PricingSection />
      <FAQSection />
      <FooterLuxury />
    </main>
  );
};

export default Index;
