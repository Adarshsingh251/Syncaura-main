import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqData = [
  {
    question: "What is SyncAura and how does it help my team?",
    answer: "SyncAura is an all-in-one workspace that brings together project management, real-time chat, video meetings, document collaboration, attendance tracking, and performance analytics. Instead of juggling multiple tools, your team gets everything in a single, unified platform — so nothing falls through the cracks."
  },
  {
    question: "How do I create and manage projects?",
    answer: "Simply navigate to the Projects section, click 'New Project', and fill in your project details. You can create tasks, assign team members, set deadlines, and track progress using our intuitive Kanban boards. Filter by status (Ongoing, Completed, On Hold) and sort by date to stay organized."
  },
  {
    question: "Does SyncAura support video meetings?",
    answer: "Yes! SyncAura has built-in meeting scheduling with automatic Google Meet link generation. You can schedule meetings, view upcoming calls on your calendar, and join video conferences directly from the platform — no need to switch between tools."
  },
  {
    question: "How does the attendance and leave system work?",
    answer: "Team members can check in and check out daily to mark their attendance. The leave management system lets you apply for casual, sick, or earned leave with just a few clicks. Managers can approve or reject requests, and everyone can view team availability at a glance."
  },
  {
    question: "Is my data secure on SyncAura?",
    answer: "Absolutely. We use industry-standard encryption for all data in transit and at rest. SyncAura supports two-step verification for added account security, and our platform undergoes regular security audits to ensure your team's data stays protected."
  },
  {
    question: "Can I use SyncAura on mobile devices?",
    answer: "Yes, SyncAura is fully responsive and works seamlessly across desktops, tablets, and mobile devices. Access your projects, chat with your team, join meetings, and manage tasks from any device with a modern web browser."
  },
  {
    question: "Does SyncAura support multiple languages?",
    answer: "Yes! SyncAura currently supports English, Hindi, and Spanish, with more languages coming soon. You can switch languages anytime from your Settings page to use the platform in your preferred language."
  },
  {
    question: "How do I get started with SyncAura?",
    answer: "Getting started is easy — just click 'Start Free' to create your account. Once signed up, you can set up your first project, invite team members, and start collaborating right away. No credit card required for the free plan."
  }
];

const FAQItem = ({ faq, index, isOpen, onToggle }) => {
  const itemId = `faq-item-${index}`;
  const contentId = `faq-content-${index}`;

  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <button
        id={itemId}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => onToggle(index)}
        className="w-full flex items-center justify-between py-5 md:py-6 px-1 text-left group cursor-pointer transition-colors duration-200"
      >
        <span
          className="text-[15px] md:text-base font-medium pr-4 leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {faq.question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex-shrink-0"
        >
          <ChevronDown
            size={20}
            style={{ color: isOpen ? 'var(--accent-color)' : 'var(--text-secondary)' }}
            className="transition-colors duration-200"
          />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={itemId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p
              className="text-[14px] md:text-[15px] leading-relaxed pb-5 md:pb-6 px-1 pr-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      id="faqs"
      className="w-full py-12 md:py-20 border-t"
      style={{
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2
            className="text-[34px] md:text-3xl lg:text-4xl font-bold mb-3 md:mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Frequently Asked Questions
          </h2>
          <p
            className="text-[15px] md:text-base leading-relaxed max-w-xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            Everything you need to know about SyncAura. Can't find the answer you're looking for? Feel free to contact our support team.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div
          className="rounded-xl border shadow-sm"
          style={{
            backgroundColor: 'var(--card-bg, var(--bg-primary))',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="px-4 md:px-6">
            {faqData.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                index={index}
                isOpen={openIndex === index}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQs;
