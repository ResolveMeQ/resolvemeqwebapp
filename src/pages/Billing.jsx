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
    <div className="space-y-8 p-6">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Billing & Plans</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">Manage your subscription, view invoices, and change your plan</p>
      </header>

      {usage && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {usage.teams_used != null && (
            <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">Teams used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{usage.teams_used}{usage.teams_limit != null ? ` / ${usage.teams_limit}` : ''}</p>
            </Card>
          )}
          {usage.tickets_this_month != null && (
            <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tickets this month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{usage.tickets_this_month}</p>
            </Card>
          )}
          {usage.members_used != null && (
            <Card className="p-4 border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">Seats used</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{usage.members_used}</p>
            </Card>
          )}
        </div>
      )}

      <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                {currentPlanDetail ? (currentPlanSlug === 'enterprise' ? <Crown size={24} className="text-white" /> : <Zap size={24} className="text-white" />) : <Users size={24} className="text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Current plan: {currentPlanDetail?.name || 'None'}</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentPlanDetail ? formatPrice(billingCycle === 'monthly' ? currentPlanDetail.price_monthly : currentPlanDetail.price_yearly) : '—'} / {billingCycle === 'monthly' ? 'month' : 'year'}
                </p>
              </div>
            </div>
            <span className={cn(
              'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
              subscription?.status === 'active' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
              subscription?.status === 'past_due' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
              (!subscription?.status || subscription?.status === 'canceled') && 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            )}>
              {subscription?.status === 'active' && <span className="w-2 h-2 bg-green-500 rounded-full mr-2 inline-block" />}
              {(subscription?.status || 'No subscription').replace('_', ' ')}
            </span>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Recurring payment</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {nextBillingDate ? (
              <>Your subscription {subscription?.status === 'active' ? 'renews' : 'renewed'} on <strong className="text-gray-900 dark:text-white">{nextBillingDate}</strong>. {nextAmount != null && nextAmount > 0 && <>You will be charged <strong>{formatPrice(nextAmount)}</strong>.</>}</>
            ) : (
              'No upcoming billing date. Choose a plan below to subscribe.'
            )}
          </p>
          {currentPlanDetail && (
            <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2"><Check size={14} className="text-green-500 shrink-0" /> Up to {currentPlanDetail.max_teams} teams</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-green-500 shrink-0" /> Up to {currentPlanDetail.max_members} members per team</li>
            </ul>
          )}
        </div>
      </Card>

      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 inline-flex">
          <button type="button" onClick={() => setBillingCycle('monthly')} className={cn('px-4 py-2 text-sm font-medium rounded-md transition-colors', billingCycle === 'monthly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}>Monthly</button>
          <button type="button" onClick={() => setBillingCycle('yearly')} className={cn('px-4 py-2 text-sm font-medium rounded-md transition-colors', billingCycle === 'yearly' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')}>Yearly <span className="ml-1 text-xs text-green-600 dark:text-green-400">(Save)</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const price = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly;
          const isCurrent = plan.id === currentPlanId || (currentPlanId == null && plan.slug === (currentPlanSlug || 'pro'));
          const isUpgrading = upgradingPlanId === plan.id;
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('relative rounded-xl border p-6 transition-all duration-200', isCurrent ? 'border-blue-500 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-lg' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-gray-300 dark:hover:border-gray-600')}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300"><Star size={12} /> Popular</span>
                </div>
              )}
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center mx-auto mb-3"><Icon size={24} className="text-white" /></div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{plan.description}</p>
                <div className="mt-4"><span className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(price)}</span><span className="text-gray-500 dark:text-gray-400">/{billingCycle === 'monthly' ? 'month' : 'year'}</span></div>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2"><Check size={14} className="text-green-500 shrink-0" /> Up to {plan.max_teams} teams</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-green-500 shrink-0" /> Up to {plan.max_members} members</li>
              </ul>
              <Button variant={isCurrent ? 'outline' : 'primary'} size="md" className="w-full" disabled={isCurrent || isUpgrading} loading={isUpgrading} onClick={() => handleChangePlan(plan.id)}>
                {isCurrent ? 'Current plan' : 'Switch to this plan'}
              </Button>
            </motion.div>
          );
        })}
      </div>

      <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Receipt size={20} /> Transaction history</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Invoices and payment history for your subscription</p>
        </div>
        <div className="overflow-x-auto">
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No invoices yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Invoices will appear here after your first billing cycle</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Period</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-24">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const isExpanded = expandedInvoiceId === inv.id;
                  const periodStr = [inv.period_start, inv.period_end].filter(Boolean).map((d) => formatDate(d)).join(' – ') || '—';
                  return (
                    <React.Fragment key={inv.id}>
                      <tr className={cn('border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50', isExpanded && 'bg-gray-50 dark:bg-gray-800/80')}>
                        <td className="py-3 px-4 text-gray-900 dark:text-white">{formatDate(inv.created_at)}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{periodStr}</td>
                        <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency || 'USD' }).format(Number(inv.amount))}</td>
                        <td className="py-3 px-4"><span className={cn('capitalize', inv.status === 'paid' && 'text-green-600 dark:text-green-400', inv.status === 'open' && 'text-amber-600 dark:text-amber-400', (inv.status === 'void' || inv.status === 'draft') && 'text-gray-500 dark:text-gray-500')}>{inv.status}</span></td>
                        <td className="py-3 px-4">
                          <button type="button" onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)} className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment methods</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Payment methods are managed per subscription. Contact support to update billing details.</p>
          <a href="mailto:support@resolvemeq.com" className="inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Contact billing support <ArrowRight size={14} className="ml-1" /></a>
        </Card>
        <Card className="p-6 border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Receipt size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Need help?</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">Questions about your bill or plan? Our team can help.</p>
          <a href="mailto:support@resolvemeq.com" className="inline-flex items-center px-3 py-2 text-sm font-medium border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white">Contact support <ArrowRight size={14} className="ml-1" /></a>
        </Card>
      </div>

      {toast && (
        <div className={cn('fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium', toast.type === 'error' ? 'bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200' : 'bg-green-100 dark:bg-green-900/80 text-green-800 dark:text-green-200')}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Billing; 