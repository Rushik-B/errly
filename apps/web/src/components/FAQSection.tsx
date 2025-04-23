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
      "Errly is an AI-powered assistant designed to help with interviews, sales calls, and online meetings by providing real-time insights and suggestions.",
  },
  {
    question: "Is Errly detectable?",
    answer:
      "Errly is built with undetectability in mind, aiming to provide seamless assistance without being noticed by other participants in the meeting.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "The free trial allows you to experience Errly's core features for a limited time. You can explore its capabilities before deciding on a subscription.",
  },
  {
    question: "What platforms does Errly support?",
    answer:
      "Errly is designed to work with popular meeting platforms like Zoom, Google Meet, and others. Check our documentation for the full list.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes, you can cancel your subscription at any time through your account settings. Please refer to our cancellation policy for details.",
  },
];

export default function FAQSection() {
  return (
    <section className="py-16 md:py-24 bg-black text-gray-200 px-4" style={{
      marginTop: "-50px"
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
              <AccordionContent className="text-gray-300 pt-4 pb-6">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
} 