import React, { useMemo, useCallback, useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';

/** Sync with App theme: `dark` on documentElement (see applyTheme in App.jsx). */
function useDocumentDarkClass() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains('dark'));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return isDark;
}

export const TOUR_STORAGE_KEY = 'resolvemeq_product_tour_v1_completed';

export function buildTourSteps(hasTeamSwitcher) {
  const steps = [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome',
      content:
        'Welcome to ResolveMeQ. This short tour highlights navigation, search, and your account.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="sidebar-nav"]',
      title: 'Navigation',
      content:
        'Use the left sidebar to switch between Tickets, Knowledge Base, Analytics, Teams, Billing, and Settings. On mobile, open the ☰ menu button.',
      disableBeacon: true,
    },
  ];

  if (hasTeamSwitcher) {
    steps.push({
      target: '[data-tour="team-switcher"]',
      title: 'Active team',
      content:
        'When you belong to teams, choose the active team here. Tickets and search can use this context.',
      disableBeacon: true,
    });
  }

  steps.push(
    {
      target: '[data-tour="global-search"]',
      title: 'Global search',
      content:
        'Search tickets, knowledge base articles, and people. On small screens, tap the magnifying glass if the field is hidden. Clear the field or press Escape to close results.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="kb-tabs"]',
      title: 'Knowledge Base',
      content:
        'Switch between Articles and Community Q&A. Browse publicly, but posting and voting requires sign-in.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="kb-ask-question"]',
      title: 'Ask a question',
      content:
        'Use “Ask question” to post issues for your workspace. Tip: type @ to mention teammates.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="new-ticket"]',
      title: 'Create a ticket',
      content:
        'When you need help, create a ticket. The AI assistant can walk through fixes and escalate to a human when needed.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="header-account"]',
      title: 'Header & account',
      content: 'Theme, notifications, and your account menu live here. Click outside a menu to close it.',
      disableBeacon: true,
    },
    {
      target: 'body',
      placement: 'center',
      title: 'You are all set',
      content: 'Replay this tour anytime from Settings → Appearance.',
      disableBeacon: true,
    }
  );

  return steps;
}

/**
 * Controlled product tour (react-joyride). Parent owns `run` and completion in localStorage.
 */
export default function AppTour({ run, setRun, hasTeamSwitcher }) {
  const steps = useMemo(() => buildTourSteps(hasTeamSwitcher), [hasTeamSwitcher]);
  const isDark = useDocumentDarkClass();

  const joyrideStyles = useMemo(() => {
    const textColor = isDark ? '#e5e7eb' : '#111827';
    const backgroundColor = isDark ? '#1f2937' : '#ffffff';
    const arrowColor = isDark ? '#1f2937' : '#ffffff';
    const muted = isDark ? '#9ca3af' : '#6b7280';

    return {
      options: {
        zIndex: 10060,
        primaryColor: '#2563eb',
        textColor,
        overlayColor: 'rgba(15, 23, 42, 0.72)',
        arrowColor,
        backgroundColor,
      },
      tooltip: {
        borderRadius: 12,
      },
      tooltipContainer: {
        textAlign: 'left',
      },
      buttonNext: {
        borderRadius: 8,
      },
      buttonBack: {
        color: isDark ? '#93c5fd' : '#2563eb',
      },
      buttonSkip: {
        color: muted,
      },
      buttonClose: {
        color: muted,
      },
    };
  }, [isDark]);

  const handleCallback = useCallback(
    (data) => {
      const { status } = data;
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        try {
          localStorage.setItem(TOUR_STORAGE_KEY, '1');
        } catch {
          /* ignore */
        }
        setRun(false);
      }
    },
    [setRun]
  );

  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleCallback}
      styles={joyrideStyles}
      locale={{ last: 'Done', skip: 'Skip tour' }}
    />
  );
}
