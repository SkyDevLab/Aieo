'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { FAQ_ITEMS, FaqItem } from '@/lib/faq-data';
import { analytics } from '@/lib/analytics';

export const FaqSection: React.FC = () => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(['what-is-aieo']));

  const toggleFaq = (item: FaqItem) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.add(item.id);
        analytics.faqOpened(item.question);
      }
      return next;
    });
  };

  return (
    <section id="faq" className="w-full max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono mb-3 border border-slate-200 dark:border-slate-700">
          <HelpCircle className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
          <span>KNOWLEDGE BASE</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Frequently Asked Questions
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Transparent answers about AI Engine Optimization, Answer Engine Optimization (AEO), and our deterministic audit methodology.
        </p>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item) => {
          const isOpen = openIds.has(item.id);
          return (
            <article
              key={item.id}
              className="rounded-xl bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleFaq(item)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${item.id}`}
              >
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  {item.question}
                </h3>
                <span className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex-shrink-0">
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </span>
              </button>

              {isOpen && (
                <div
                  id={`faq-answer-${item.id}`}
                  className="px-4 pb-4 sm:px-5 sm:pb-5 pt-0 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 mt-1 pt-3"
                >
                  <p>{item.answer}</p>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
