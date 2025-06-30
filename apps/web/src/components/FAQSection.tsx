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
    question: "What is Errly and why should I use it?",
    answer:
      "Errly is an error alerting service that instantly notifies you via SMS when your app encounters critical errors. Use it to respond immediately to critical issues and minimize downtime.",
  },
  {
    question: "How do I add Errly to my app? (Integration in under 2 minutes)",
    answer:
      "Integration takes less than 2 minutes. You can use our NPM SDK package or add a simple API call in your app\'s error handling logic. Check out our documentation for detailed guides!",
  },
  {
    question: "Which programming languages and frameworks work with Errly?",
    answer:
      "Errly is language-agnostic and works with any language or framework. Integration is done via a simple REST API call. Official SDKs for popular languages are coming soon.",
  },
  {
    question: "How does Errly keep me from getting spammed by the same error?",
    answer:
      "Errly intelligently groups similar errors based on stack traces and context, and uses rate-limiting to ensure you only receive alerts for new or significantly recurring issues, keeping your notifications meaningful.",
  },
  {
    question: "How do I manage who receives my SMS alerts and mute or resolve errors?",
    answer:
      "Within your Errly project dashboard, you can configure which phone numbers receive alerts. You can also mute specific errors temporarily or mark them as resolved to stop receiving notifications for them.",
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