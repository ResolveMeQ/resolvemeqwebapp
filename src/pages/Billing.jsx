import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  Star,
  CreditCard,
  Download,
  Users,
  Zap,
  ArrowRight,
  Crown,
  Receipt,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Mail,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api, isBillingRecoverableError } from '../services/api';
import { BillingPageSkeleton } from '../components/ui/Skeleton';

const Billing = ({ onRefreshUserData }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [plansFromApi, setPlansFromApi] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [upgradingPlanId, setUpgradingPlanId] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [emailSaving, setEmailSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSubmitting, setSupportSubmitting] = useState(false);
  const [supportFormError, setSupportFormError] = useState('');

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadBilling = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const [plansData, subData, usageData, invoicesData] = await Promise.all([
        api.billing.getPlans(),
        api.billing.getSubscription(),
        api.billing.getUsage(),
        api.billing.getInvoices(),
      ]);
      setPlansFromApi(Array.isArray(plansData) ? plansData : []);
      setSubscription(subData || null);
      setUsage(usageData || null);
      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
      try {
        const prefs = await api.settings.getPreferences();
        setEmailNotifications(prefs?.email_notifications ?? true);
      } catch {
        setEmailNotifications(true);
      }
      return true;
    } catch (err) {
      console.error('Billing load error:', err);
      setLoadError(err?.message || 'Failed to load billing.');
      if (!silent) showToast(err?.message || 'Failed to load billing.', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const bi = subscription?.billing_interval;
    if (bi === 'monthly' || bi === 'yearly') {
      setBillingCycle(bi);
    }
  }, [subscription?.id, subscription?.billing_interval]);

  useEffect(() => {
    const checkoutSuccess = searchParams.get('checkout') === 'success' || searchParams.get('session_id');
    loadBilling().then((ok) => {
      if (ok && checkoutSuccess) {
        showToast('Subscription updated successfully. Thank you!', 'success');
        onRefreshUserData?.();
      }
      if (checkoutSuccess) setSearchParams({}, { replace: true });
    });
  }, [onRefreshUserData]);

  const currentPlanDetail = subscription?.plan_detail || subscription?.plan;
  const currentPlanId = currentPlanDetail?.id ? String(currentPlanDetail.id) : null;
  const currentPlanSlug = (currentPlanDetail?.slug || currentPlanDetail?.name || '').toLowerCase();

  const isPlanUuid = (id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id));

  const hasDodoSubscription = Boolean(subscription?.gateway_subscription_id);

  /** Must match Dodo subscription cadence — not the price toggle — or change-plan 404s. */
  const billingIntervalForChangePlan = () => {
    const fromApi = subscription?.billing_interval;
    if (fromApi === 'monthly' || fromApi === 'yearly') return fromApi;
    const s = subscription?.current_period_start;
    const e = subscription?.current_period_end;
    if (!s || !e) return billingCycle === 'monthly' ? 'monthly' : 'yearly';
    const start = new Date(s).getTime();
    const end = new Date(e).getTime();
    if (!(end > start)) return billingCycle === 'monthly' ? 'monthly' : 'yearly';
    const days = Math.round((end - start) / 86400000);
    if (days >= 24 && days <= 40) return 'monthly';
    if (days >= 300) return 'yearly';
    if (days <= 45) return 'monthly';
    return billingCycle === 'monthly' ? 'monthly' : 'yearly';
  };

  /** Hosted Dodo checkout for a plan UUID (new sub or recovery when change-plan cannot link). */
  const startHostedCheckoutForPlan = async (planId, billing_interval) => {
    const returnUrl = `${window.location.origin}/billing?checkout=success`;
    const res = await api.billing.createCheckoutSession({
      plan: planId,
      billing_interval,
      return_url: returnUrl,
    });
    if (res?.checkout_url) {
      window.location.href = res.checkout_url;
      return true;
    }
    showToast('Checkout did not return a URL. Please try again or contact support.', 'error');
    return false;
  };

  const handleChangePlan = async (planId) => {
    if (!planId || planId === currentPlanId) return;

    if (hasDodoSubscription && planId !== currentPlanId) {
      if (!isPlanUuid(planId) || !canCheckout(planId)) {
        showToast('This plan is not available. Please refresh or contact support.', 'error');
        return;
      }
      setUpgradingPlanId(planId);
      try {
        const res = await api.billing.changePlan({
          plan: planId,
          billing_interval: billingIntervalForChangePlan(),
        });
        await loadBilling();
        onRefreshUserData?.();
        showToast(
          res?.scheduled ? res?.detail || 'Downgrade scheduled for your next billing date.' : 'Plan updated successfully.',
        );
      } catch (err) {
        if (
          isBillingRecoverableError(err) &&
          err.recovery === 'checkout' &&
          err.billing_error === 'subscription_not_found'
        ) {
          showToast('Taking you to secure checkout to finish this plan change.', 'success');
          try {
            await startHostedCheckoutForPlan(planId, billingIntervalForChangePlan());
          } catch (checkoutErr) {
            showToast(checkoutErr?.message || 'Could not start checkout. Try again or contact support.', 'error');
          }
        } else {
          showToast(err?.message || err?.detail || 'Failed to change plan.', 'error');
        }
      } finally {
        setUpgradingPlanId(null);
      }
      return;
    }

    if (isPlanUuid(planId) && !canCheckout(planId)) {
      showToast('This plan is not available for checkout. Please refresh or contact support.', 'error');
      return;
    }

    if (!isPlanUuid(planId)) {
      setUpgradingPlanId(planId);
      try {
        await api.billing.updateSubscription({ plan: planId });
        await loadBilling();
        onRefreshUserData?.();
        showToast('Plan updated successfully.');
      } catch (err) {
        showToast(err?.message || err?.error || 'Failed to change plan.', 'error');
      } finally {
        setUpgradingPlanId(null);
      }
      return;
    }

    setUpgradingPlanId(planId);
    try {
      const ok = await startHostedCheckoutForPlan(
        planId,
        billingCycle === 'monthly' ? 'monthly' : 'yearly',
      );
      if (ok) return;
    } catch (err) {
      showToast(err?.message || 'Could not start checkout. Please try again.', 'error');
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const plans = plansFromApi.length > 0
    ? plansFromApi
        .filter((p) => !p.is_trial || (currentPlanSlug || '').includes('trial'))
        .map((p) => ({
          id: String(p.id),
          slug: (p.slug || p.name || '').toLowerCase(),
          name: p.name,
          is_trial: Boolean(p.is_trial),
          description: p.is_trial ? '14-day free trial. No credit card required.' : p.name === 'Starter' ? 'Perfect for small teams' : p.name === 'Enterprise' ? 'For large organizations' : 'Ideal for growing businesses',
          price_monthly: Number(p.price_monthly) || 0,
          price_yearly: Number(p.price_yearly) || 0,
          max_teams: p.max_teams,
          max_members: p.max_members,
          popular: (p.slug || '') === 'pro',
          icon: (p.slug || '') === 'enterprise' ? Crown : (p.slug || '') === 'pro' ? Zap : (p.slug || '') === 'trial' ? Users : Zap,
          fromApi: true,
        }))
    : [
        { id: 'starter', slug: 'starter', name: 'Starter', price_monthly: 19, price_yearly: 190, max_teams: 5, max_members: 10, popular: false, icon: Users, description: 'Perfect for small teams', fromApi: false },
        { id: 'pro', slug: 'pro', name: 'Pro', price_monthly: 49, price_yearly: 490, max_teams: 20, max_members: 50, popular: true, icon: Zap, description: 'Ideal for growing businesses', fromApi: false },
        { id: 'enterprise', slug: 'enterprise', name: 'Enterprise', price_monthly: 99, price_yearly: 990, max_teams: 999, max_members: 999, popular: false, icon: Crown, description: 'For large organizations', fromApi: false },
      ];

  const canCheckout = (planId) => isPlanUuid(planId) && plansFromApi.some((p) => String(p.id) === planId && !p.is_trial);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price || 0);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  const nextBillingDate = subscription?.current_period_end ? formatDate(subscription.current_period_end) : null;
  const nextAmount = currentPlanDetail && (billingCycle === 'yearly' ? currentPlanDetail.price_yearly : currentPlanDetail.price_monthly);
  const periodEndDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const periodEndIsPast = periodEndDate ? periodEndDate.getTime() < Date.now() - (6 * 60 * 60 * 1000) : false;
  const effectiveStatus = subscription?.status === 'trial'
    ? 'trial'
    : periodEndIsPast
      ? 'past_due'
      : (subscription?.status || '');

  if (loading && !subscription && plansFromApi.length === 0) {
    return <BillingPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Billing & Plans</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage your subscription and billing. New subscriptions are completed securely via Payments checkout.
        </p>
      </header>

      {loadError && (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-800 dark:text-red-200">{loadError}</p>
          <Button variant="outline" size="sm" onClick={() => loadBilling()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {subscription?.over_limit && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="text-sm text-amber-900 dark:text-amber-100">
            <p className="font-medium">You’re over your current plan limits.</p>
            <p className="mt-0.5 text-amber-800/90 dark:text-amber-100/80">
              Nothing has been deleted — but some actions are blocked until you upgrade or reduce usage.
            </p>
            {Array.isArray(subscription?.over_limit_reasons) && subscription.over_limit_reasons.length > 0 && (
              <ul className="mt-2 space-y-1">
                {subscription.over_limit_reasons.map((r, idx) => (
                  <li key={idx} className="text-xs text-amber-800 dark:text-amber-100/80">
                    {r?.type === 'teams'
                      ? `Teams: ${r.used} used (limit ${r.limit})`
                      : r?.type === 'members_per_team'
                        ? `Members per team: up to ${r.used} in a team (limit ${r.limit})`
                        : 'Plan limit exceeded'}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => loadBilling(true)}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button variant="primary" size="sm" onClick={() => showToast('Upgrade to increase limits from the plans below.', 'info')}>
              View plans
            </Button>
          </div>
        </div>
      )}

      {usage && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {usage.teams_used != null && (
            <Card className="p-5">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Teams used</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{usage.teams_used}{usage.teams_limit != null ? ` / ${usage.teams_limit}` : ''}</p>
            </Card>
          )}
          {usage.tickets_this_month != null && (
            <Card className="p-5">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Tickets this month</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{usage.tickets_this_month}</p>
            </Card>
          )}
          {usage.members_used != null && (
            <Card className="p-5">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Seats used</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{usage.members_used}</p>
            </Card>
          )}
          {usage.agent_operations_unlimited ? (
            <Card className="p-5">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">AI agent usage</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">Unlimited</p>
            </Card>
          ) : usage.agent_operations_limit != null && usage.agent_operations_used != null ? (
            <Card className="p-5">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">AI agent usage (this period)</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {usage.agent_operations_used} / {usage.agent_operations_limit}
              </p>
              {usage.agent_period_ends_at && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Resets {new Date(usage.agent_period_ends_at).toLocaleDateString()}
                </p>
              )}
            </Card>
          ) : null}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                {currentPlanDetail ? (currentPlanSlug === 'enterprise' ? <Crown size={24} className="text-white" /> : <Zap size={24} className="text-white" />) : <Users size={24} className="text-white" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Current plan: {currentPlanDetail?.name || 'None'}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentPlanDetail ? formatPrice(billingCycle === 'monthly' ? currentPlanDetail.price_monthly : currentPlanDetail.price_yearly) : '—'} / {billingCycle === 'monthly' ? 'month' : 'year'}
                </p>
              </div>
            </div>
            <span className={cn(
              'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
              effectiveStatus === 'trial' && 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50',
              effectiveStatus === 'active' && 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50',
              effectiveStatus === 'past_due' && 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800/50',
              (!effectiveStatus || effectiveStatus === 'canceled') && 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
            )}>
              {effectiveStatus === 'active' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 inline-block" />}
              {effectiveStatus === 'past_due' && <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1.5 inline-block" />}
              {effectiveStatus === 'trial'
                ? 'Free trial'
                : effectiveStatus === 'past_due'
                  ? 'Payment overdue'
                  : (effectiveStatus || 'No subscription').replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
            {subscription?.status === 'trial' ? 'Trial status' : 'Recurring payment'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {subscription?.status === 'trial' && subscription?.trial_ends_at ? (
              <>Your free trial ends on <strong className="text-gray-900 dark:text-white">{formatDate(subscription.trial_ends_at)}</strong>. Upgrade to a paid plan to continue with full access.</>
            ) : nextBillingDate ? (
              periodEndIsPast ? (
                <>
                  Your billing period ended on <strong className="text-gray-900 dark:text-white">{nextBillingDate}</strong>. To keep full access, please renew your subscription or update your payment method.
                </>
              ) : (
                <>
                  Your subscription {subscription?.status === 'active' ? 'renews' : 'renewed'} on{' '}
                  <strong className="text-gray-900 dark:text-white">{nextBillingDate}</strong>.{' '}
                  {nextAmount != null && nextAmount > 0 && (
                    <>
                      You will be charged <strong>{formatPrice(nextAmount)}</strong>.
                    </>
                  )}
                </>
              )
            ) : (
              'No upcoming billing date. Choose a plan below to subscribe.'
            )}
          </p>
          {periodEndIsPast && subscription?.gateway_customer_id && (
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                loading={portalLoading}
                disabled={portalLoading}
                onClick={async () => {
                  setPortalLoading(true);
                  try {
                    const res = await api.billing.openCustomerPortal();
                    if (res?.url) {
                      window.location.href = res.url;
                      return;
                    }
                    showToast('Could not open billing portal. Please try again.', 'error');
                  } catch (err) {
                    showToast(err?.message || 'Failed to open billing portal.', 'error');
                  } finally {
                    setPortalLoading(false);
                  }
                }}
              >
                Update payment method
              </Button>
            </div>
          )}
          {currentPlanDetail && (
            <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><Check size={14} className="text-green-600 shrink-0" /> Up to {currentPlanDetail.max_teams} teams</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-green-600 shrink-0" /> Up to {currentPlanDetail.max_members} members per team</li>
            </ul>
          )}
        </div>
      </Card>

      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex">
          <button type="button" onClick={() => setBillingCycle('monthly')} className={cn('px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150', billingCycle === 'monthly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}>Monthly</button>
          <button type="button" onClick={() => setBillingCycle('yearly')} className={cn('px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150', billingCycle === 'yearly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}>Yearly <span className="ml-1 text-xs text-green-600 dark:text-green-400">(Save 15%)</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const isCurrent = plan.id === currentPlanId || (currentPlanId == null && plan.slug === (currentPlanSlug || 'pro'));
          const isUpgrading = upgradingPlanId === plan.id;
          const currentPrice = currentPlanDetail ? (billingCycle === 'yearly' ? currentPlanDetail.price_yearly : currentPlanDetail.price_monthly) : 0;
          const isDowngrade = !isCurrent && price < currentPrice;
          return (
            <Card
              key={plan.id}
              className={cn('relative p-6 transition-all duration-150', isCurrent ? 'ring-2 ring-primary-500 shadow-md' : 'hover:shadow-md')}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"><Star size={12} /> Popular</span>
                </div>
              )}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-3"><Icon size={24} className="text-white" /></div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{plan.description}</p>
                <div className="mt-4"><span className="text-3xl font-semibold text-gray-900 dark:text-white">{plan.is_trial ? 'Free' : formatPrice(price)}</span>{!plan.is_trial && <span className="text-sm text-gray-500 dark:text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>}</div>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600 shrink-0" /> Up to {plan.max_teams} teams</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600 shrink-0" /> Up to {plan.max_members} members</li>
              </ul>
              <Button
                variant={isCurrent ? 'outline' : 'primary'}
                size="md"
                className="w-full"
                disabled={isCurrent || isUpgrading || (plan.fromApi === false && !isCurrent)}
                loading={isUpgrading}
                onClick={() => handleChangePlan(plan.id)}
              >
                {isCurrent ? 'Current plan' : plan.fromApi === false ? 'Contact support to subscribe' : isDowngrade ? 'Downgrade' : 'Upgrade'}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Receipt size={18} /> Transaction History</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Invoices and payment history</p>
        </div>
        <div className="overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No invoices yet</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Invoices will appear here after your first billing cycle</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Period</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Pricing Type</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide w-24">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  const periodStr = [inv.period_start, inv.period_end].filter(Boolean).map((d) => formatDate(d)).join(' – ') || '—';
                  return (
                    <React.Fragment key={inv.id}>
                      <tr className={cn('border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors', isExpanded && 'bg-gray-50 dark:bg-gray-900/50')}>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{formatDate(inv.created_at)}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{periodStr}</td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(Number(inv.amount))}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50">
                            {(inv.pricing_type || 'subscription').replace(/^\w/, (c) => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="py-3 px-4"><span className={cn('capitalize text-sm', inv.status === 'paid' && 'text-green-600 dark:text-green-400', inv.status === 'open' && 'text-amber-600 dark:text-amber-400', (inv.status === 'void' || inv.status === 'draft') && 'text-gray-500 dark:text-gray-500')}>{inv.status}</span></td>
                        <td className="py-3 px-4">
                          <button type="button" onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)} className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />} View
                          </button>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.tr initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-gray-100 dark:border-gray-700/50">
                            <td colSpan={6} className="p-4 bg-gray-50 dark:bg-gray-800/80">
                              <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div><span className="text-gray-500 dark:text-gray-400">Invoice ID</span><br /><span className="font-mono text-gray-900 dark:text-white text-xs">{String(inv.id).slice(0, 8)}…</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Period</span><br /><span className="text-gray-900 dark:text-white">{periodStr}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Amount</span><br /><span className="text-gray-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(Number(inv.amount))}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Status</span><br /><span className="capitalize text-gray-900 dark:text-white">{inv.status}</span></div>
                                <div className="ml-auto">
                                  {inv.invoice_url ? (
                                    <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                      <Download size={14} /> Download receipt
                                    </a>
                                  ) : (
                                    <span className="text-xs text-gray-500 dark:text-gray-500">Receipt not available</span>
                                  )}
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Email Notifications</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Receive emails for invoices, receipts, and subscription updates.
          </p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={async (e) => {
                const next = e.target.checked;
                setEmailNotifications(next);
                setEmailSaving(true);
                try {
                  await api.settings.updatePreferences({ email_notifications: next });
                  showToast(next ? 'Email notifications enabled' : 'Email notifications disabled');
                } catch {
                  setEmailNotifications(!next);
                  showToast('Failed to update. Try again.', 'error');
                } finally {
                  setEmailSaving(false);
                }
              }}
              disabled={emailSaving}
              className="sr-only peer"
            />
            <div className={cn(
              'w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer-checked:bg-primary-600',
              'after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full peer-checked:after:border-white',
              emailSaving && 'opacity-50 pointer-events-none'
            )} />
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {emailNotifications ? 'On' : 'Off'}
            </span>
          </label>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {subscription?.gateway_customer_id
              ? 'Update your card, payment methods, and billing details in the secure payments portal.'
              : 'Card and payment methods are collected on the checkout page when you subscribe.'}
          </p>
          {subscription?.gateway_customer_id ? (
            <Button
              variant="outline"
              size="md"
              loading={portalLoading}
              disabled={portalLoading}
              onClick={async () => {
                setPortalLoading(true);
                try {
                  const res = await api.billing.openCustomerPortal();
                  if (res?.url) {
                    window.location.href = res.url;
                    return;
                  }
                  showToast('Could not open billing portal. Please try again.', 'error');
                } catch (err) {
                  showToast(err?.message || 'Failed to open billing portal.', 'error');
                } finally {
                  setPortalLoading(false);
                }
              }}
              className="inline-flex items-center gap-2"
            >
              <CreditCard size={16} />
              Manage payment methods <ArrowRight size={14} />
            </Button>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500">Subscribe to a plan to add and manage payment methods.</p>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Receipt className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Need Help?</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Questions about your bill or plan? Send us a message — we&apos;ll email you back.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="inline-flex items-center gap-1"
            onClick={() => {
              setSupportFormError('');
              setSupportOpen(true);
            }}
          >
            Contact support <ArrowRight size={14} />
          </Button>
        </Card>
      </div>

      {toast && (
        <div
          className={cn(
            'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium',
            toast.type === 'error' && 'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800',
            toast.type === 'info' && 'bg-blue-50 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
            (toast.type === 'success' || !toast.type) && 'bg-green-50 dark:bg-green-900/80 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
          )}
        >
          {toast.message}
        </div>
      )}

      {supportOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="billing-support-title">
            <button
              type="button"
              className="absolute inset-0 bg-black/50 dark:bg-black/60"
              aria-label="Close"
              onClick={() => !supportSubmitting && setSupportOpen(false)}
            />
            <div className="relative w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0" />
                  <h2 id="billing-support-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                    Contact support
                  </h2>
                </div>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => !supportSubmitting && setSupportOpen(false)}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Describe your question (billing, plan, or invoice). We&apos;ll reply to your account email.
              </p>
              {supportFormError && (
                <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200" role="alert">
                  {supportFormError}
                </div>
              )}
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSupportFormError('');
                  const msg = supportMessage.trim();
                  if (msg.length < 10) {
                    setSupportFormError('Please enter at least 10 characters so we can help.');
                    return;
                  }
                  setSupportSubmitting(true);
                  try {
                    await api.billing.submitSupportContact({
                      message: msg,
                      subject: supportSubject.trim(),
                      page_context: 'billing',
                    });
                    showToast('Message sent. Our team will get back to you soon.', 'success');
                    setSupportOpen(false);
                    setSupportSubject('');
                    setSupportMessage('');
                  } catch (err) {
                    const m = err?.message || 'Could not send message. Try again later.';
                    setSupportFormError(m);
                  } finally {
                    setSupportSubmitting(false);
                  }
                }}
              >
                <div>
                  <label htmlFor="support-subject" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Subject (optional)
                  </label>
                  <input
                    id="support-subject"
                    type="text"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="e.g. Question about my invoice"
                    maxLength={200}
                  />
                </div>
                <div>
                  <label htmlFor="support-message" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Message
                  </label>
                  <textarea
                    id="support-message"
                    required
                    rows={5}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="How can we help?"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" disabled={supportSubmitting} onClick={() => setSupportOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" loading={supportSubmitting} disabled={supportSubmitting}>
                    Send message
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default Billing; 