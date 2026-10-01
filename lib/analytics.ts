/**
 * Analytics configuration and tracking events for Website AIEO Checker.
 * Supports Google Analytics 4 (GA4) via NEXT_PUBLIC_GA_ID.
 * Gracefully no-ops when the tracking ID is not configured.
 */

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js' | 'set',
      targetIdOrAction: string | Date,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Dispatches a custom GA event if gtag is available and tracking ID is set.
 */
export const trackEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_TRACKING_ID) {
    try {
      window.gtag('event', eventName, params);
    } catch {
      // Graceful error suppression
    }
  }
};

export const analytics = {
  auditUrlSubmitted: () => {
    trackEvent('audit_url_submitted');
  },

  auditStarted: (hostname?: string) => {
    trackEvent('audit_started', {
      target_hostname: hostname || 'redacted',
    });
  },

  auditCompleted: (summary: {
    score: number;
    categories?: {
      crawlability?: number;
      content?: number;
      structuredData?: number;
      entity?: number;
      answerReadiness?: number;
    };
    durationMs?: number;
    totalChecks?: number;
  }) => {
    // Only send aggregate, non-sensitive diagnostic metrics
    trackEvent('audit_completed', {
      score: summary.score,
      category_crawlability: summary.categories?.crawlability,
      category_content: summary.categories?.content,
      category_structured_data: summary.categories?.structuredData,
      category_entity: summary.categories?.entity,
      category_answer_readiness: summary.categories?.answerReadiness,
      duration_ms: summary.durationMs,
      checks_count: summary.totalChecks,
    });
  },

  auditFailed: (errorType: string) => {
    trackEvent('audit_failed', {
      error_type: errorType.slice(0, 100),
    });
  },

  shareReportClicked: (method: 'copy_summary' | 'copy_link' | 'native_share') => {
    trackEvent('share_report_clicked', { method });
  },

  themeChanged: (theme: 'light' | 'dark') => {
    trackEvent('theme_changed', { theme });
  },

  faqOpened: (question: string) => {
    trackEvent('faq_opened', { question });
  },

  ctaClicked: (ctaName: string) => {
    trackEvent('cta_clicked', { cta_name: ctaName });
  },
};
