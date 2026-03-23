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
      target: 'body',
      placement: 'center',
      title: 'Find your way around',
      content: (
        <div className="text-sm text-gray-700 dark:text-gray-200 space-y-2">
          <p>
            On a large screen, use the <strong>left sidebar</strong> for Dashboard, Tickets,
            Analytics, Knowledge base, Teams, Users, Billing, and Settings.
          </p>
          <p>
            On a phone or tablet, open the <strong>menu (☰)</strong> in the top-left for the same
            links.
          </p>
        </div>
      ),
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
