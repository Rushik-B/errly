import React from "react";
import FeatureCards from "./FeatureCards";

export default function HeroSection() {
  return (
    <div
      className="w-full flex flex-col items-center pt-10 min-h-[800px] px-2"
      style={{ backgroundColor: "black" }}
      
    >
      <h1 className="text-[56px] leading-[1.08] font-bold text-center text-white tracking-tight mb-2 animate-fade-in drop-shadow-md font-sans">
        Placeholder Offers True <br />
        <span className="whitespace-nowrap">Undetectability</span>
      </h1>
      <p className="text-xl text-white/60 text-center max-w-2xl mb-16 animate-fade-in [animation-delay:.2s]">
        Replace this text with your subheadline here. Keep it short and insightful for best engagement.
      </p>
      <FeatureCards />
    </div>
  );
}
