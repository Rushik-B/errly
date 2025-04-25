import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus } from "lucide-react";

const faqData = [
  {
    question: "What is Errly?",
    answer:
      "Errly is an error alerting service that instantly notifies you via SMS when your app encounters critical errors, so you can respond immediately.",
  },
  {
    question: "How easy is it to integrate Errly?",
    answer:
      "Integration takes less than 5 minutes. Just add one line of code to your app, and you're good to go.",
  },
  {
    question: "Does Errly support my stack?",
    answer:
      "Yes! Errly is language-agnostic and integrates easily via a simple REST API. Official SDKs coming soon.",
  },
  {
    question: "How does Errly prevent alert spam?",
    answer:
      "Errly intelligently groups similar errors and uses rate-limiting to ensure alerts remain meaningful and actionable.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Absolutely. There are no lock-ins or hidden conditions—you can easily cancel your subscription anytime.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-black text-gray-200 px-5" style={{
      marginTop: "-50px",
      
    }}>
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-center font-semibold tracking-tight text-slate-200 drop-shadow-lg md:text-6xl sm:text-5xl text-4xl mb-12">
          Have Questions?
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {faqData.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-white/10"
            >
              <AccordionTrigger className="text-left font-medium text-lg hover:no-underline py-6 [&>.h-4.w-4.shrink-0]:hidden">
                {item.question}
                <Plus className="h-5 w-5 text-white/70 shrink-0" />
              </AccordionTrigger>
              <AccordionContent className="text-gray-300 pt-4 pb-6 text-lg">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
} 