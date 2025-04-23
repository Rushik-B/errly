import React from "react";
import NavBar from "../components/NavBar";
import FooterLuxury from "../components/FooterLuxury";

const ComingSoon: React.FC = () => {
  return (
    <div className="flex flex-col">
      <NavBar />
      <main className="h-screen flex items-center justify-center bg-black">
        <h1 className="font-semibold tracking-tight text-slate-200 drop-shadow-lg md:text-6xl sm:text-5xl text-4xl text-center">
          Coming Soon.
        </h1>
      </main>
      <FooterLuxury />
    </div>
  );
};

export default ComingSoon; 