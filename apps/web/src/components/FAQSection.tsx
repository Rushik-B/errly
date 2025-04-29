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
      "Errly is an error monitoring and alerting service. It captures errors from your applications, displays them on a dashboard with details and trends, and instantly notifies you via SMS for critical issues.",
  },
  {
    question: "How do I integrate Errly?",
    answer:
      "Integration is simple. Create a project to get an API key, then use our lightweight SDK (currently JavaScript/npm) or send errors directly to our REST API endpoint using your key.",
  },
  {
    question: "What technologies does Errly support?",
    answer:
      "Errly works with any technology that can send HTTP requests. We provide a JavaScript SDK for easy integration with Node.js and browser applications, and you can use our REST API for other languages (Python, Go, Ruby, etc.).",
  },
  {
    question: "How does Errly handle noisy errors?",
    answer:
      "Errly automatically groups similar errors based on their message and level. We also implement rate limiting on SMS notifications for grouped errors to prevent alert fatigue, while still providing detailed logs in the dashboard.",
  },
  {
    question: "What information can I see on the dashboard?",
    answer:
      "The dashboard shows a list of errors for each project, including the error message, level (error, warn, info, log), number of occurrences (hits), trend sparklines, metadata, stack traces, and the time they were received. You can filter by level, search by message, and select different time ranges.",
  },
  {
    question: "How do I configure SMS notifications?",
    answer:
      "You can add and verify your phone number in your user profile. Currently, notifications are sent for errors logged with the 'error' level. More granular controls are planned for the future.",
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