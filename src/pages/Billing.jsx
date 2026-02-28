import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { cn } from '../utils/cn';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { api } from '../services/api';

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [plansFromApi, setPlansFromApi] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [upgradingPlanId, setUpgradingPlanId] = useState(null);
  const [toast, setToast] = useState(null);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const loadBilling = useCallback(async () => {
    setLoading(true);
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
    } catch (err) {
      console.error('Billing load error:', err);
      showToast(err?.message || 'Failed to load billing.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const currentPlanDetail = subscription?.plan_detail || subscription?.plan;
  const currentPlanId = currentPlanDetail?.id ? String(currentPlanDetail.id) : null;
  const currentPlanSlug = (currentPlanDetail?.slug || currentPlanDetail?.name || '').toLowerCase();

  const handleChangePlan = async (planId) => {
    if (!planId || planId === currentPlanId) return;
    setUpgradingPlanId(planId);
    try {
      await api.billing.updateSubscription({ plan: planId });
      await loadBilling();
      showToast('Plan updated successfully.');
    } catch (err) {
      showToast(err?.message || err?.error || 'Failed to change plan.', 'error');
    } finally {
      setUpgradingPlanId(null);
    }
  };

  const plans = plansFromApi.length > 0
    ? plansFromApi.map((p) => ({
        id: String(p.id),
        slug: (p.slug || p.name || '').toLowerCase(),
        name: p.name,
        description: p.name === 'Starter' ? 'Perfect for small teams' : p.name === 'Enterprise' ? 'For large organizations' : 'Ideal for growing businesses',
        price_monthly: Number(p.price_monthly) || 0,
        price_yearly: Number(p.price_yearly) || 0,
        max_teams: p.max_teams,
        max_members: p.max_members,
        popular: (p.slug || '') === 'pro',
        icon: (p.slug || '') === 'enterprise' ? Crown : (p.slug || '') === 'pro' ? Zap : Users,
      }))
    : [
        { id: 'starter', slug: 'starter', name: 'Starter', price_monthly: 19, price_yearly: 190, max_teams: 5, max_members: 10, popular: false, icon: Users, description: 'Perfect for small teams' },
        { id: 'pro', slug: 'pro', name: 'Pro', price_monthly: 49, price_yearly: 490, max_teams: 20, max_members: 50, popular: true, icon: Zap, description: 'Ideal for growing businesses' },
        { id: 'enterprise', slug: 'enterprise', name: 'Enterprise', price_monthly: 99, price_yearly: 990, max_teams: 999, max_members: 999, popular: false, icon: Crown, description: 'For large organizations' },
      ];

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price || 0);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  const nextBillingDate = subscription?.current_period_end ? formatDate(subscription.current_period_end) : null;
  const nextAmount = currentPlanDetail && (billingCycle === 'yearly' ? currentPlanDetail.price_yearly : currentPlanDetail.price_monthly);

  if (loading && !subscription && plansFromApi.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Billing & Plans</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your subscription and billing</p>
      </header>

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
              subscription?.status === 'active' && 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50',
              subscription?.status === 'past_due' && 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/50',
              (!subscription?.status || subscription?.status === 'canceled') && 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
            )}>
              {subscription?.status === 'active' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 inline-block" />}
              {(subscription?.status || 'No subscription').replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Recurring payment</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {nextBillingDate ? (
              <>Your subscription {subscription?.status === 'active' ? 'renews' : 'renewed'} on <strong className="text-gray-900 dark:text-white">{nextBillingDate}</strong>. {nextAmount != null && nextAmount > 0 && <>You will be charged <strong>{formatPrice(nextAmount)}</strong>.</>}</>
            ) : (
              'No upcoming billing date. Choose a plan below to subscribe.'
            )}
          </p>
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
                <div className="mt-4"><span className="text-3xl font-semibold text-gray-900 dark:text-white">{formatPrice(price)}</span><span className="text-sm text-gray-500 dark:text-gray-400">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span></div>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600 shrink-0" /> Up to {plan.max_teams} teams</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-600 shrink-0" /> Up to {plan.max_members} members</li>
              </ul>
              <Button variant={isCurrent ? 'outline' : 'primary'} size="md" className="w-full" disabled={isCurrent || isUpgrading} loading={isUpgrading} onClick={() => handleChangePlan(plan.id)}>
                {isCurrent ? 'Current plan' : 'Upgrade'}
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
                            <td colSpan={5} className="p-4 bg-gray-50 dark:bg-gray-800/80">
                              <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div><span className="text-gray-500 dark:text-gray-400">Invoice ID</span><br /><span className="font-mono text-gray-900 dark:text-white text-xs">{String(inv.id).slice(0, 8)}…</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Period</span><br /><span className="text-gray-900 dark:text-white">{periodStr}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Amount</span><br /><span className="text-gray-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(Number(inv.amount))}</span></div>
                                <div><span className="text-gray-500 dark:text-gray-400">Status</span><br /><span className="capitalize text-gray-900 dark:text-white">{inv.status}</span></div>
                                <div className="ml-auto">
                                  <button type="button" onClick={() => showToast('PDF download coming soon.')} className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <Download size={14} /> Download receipt
                                  </button>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <CreditCard size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Payment methods are managed per subscription. Contact support to update billing details.</p>
          <a href="mailto:support@resolvemeq.com" className="inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors">Contact billing support <ArrowRight size={14} className="ml-1" /></a>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
              <Receipt size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Need Help?</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Questions about your bill or plan? Our team can help.</p>
          <a href="mailto:support@resolvemeq.com" className="inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white transition-colors">Contact support <ArrowRight size={14} className="ml-1" /></a>
        </Card>
      </div>

      {toast && (
        <div className={cn('fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium', toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/80 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800')}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Billing; 