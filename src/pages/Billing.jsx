import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  X, 
  Star, 
  CreditCard, 
  Download, 
  Calendar,
  Users,
  Zap,
  Shield,
  Headphones,
  ArrowRight,
  Crown,
  Sparkles
} from 'lucide-react';
import { cn } from '../utils/cn';

const Billing = () => {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Current user plan data
  const currentPlan = {
    name: 'Pro',
    price: 49,
    cycle: 'monthly',
    nextBilling: '2024-02-15',
    status: 'active',
    features: [
      'Up to 50 team members',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Advanced reporting'
    ]
  };

  // Available plans
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      price: { monthly: 19, yearly: 190 },
      features: [
        'Up to 10 team members',
        'Basic ticket management',
        'Email support',
        'Standard integrations',
        'Basic reporting'
      ],
      limitations: [
        'No advanced analytics',
        'No priority support',
        'Limited customizations'
      ],
      popular: false,
      icon: Users
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Ideal for growing businesses',
      price: { monthly: 49, yearly: 490 },
      features: [
        'Up to 50 team members',
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'Advanced reporting',
        'Team collaboration tools',
        'API access'
      ],
      limitations: [
        'No enterprise features',
        'Limited advanced security'
      ],
      popular: true,
      icon: Zap
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations with complex needs',
      price: { monthly: 99, yearly: 990 },
      features: [
        'Unlimited team members',
        'Enterprise analytics',
        '24/7 phone support',
        'Custom integrations',
        'Advanced reporting',
        'Team collaboration tools',
        'API access',
        'Advanced security',
        'Custom branding',
        'Dedicated account manager',
        'SLA guarantees'
      ],
      limitations: [],
      popular: false,
      icon: Crown
    }
  ];

  const handlePlanChange = (planId) => {
    setSelectedPlan(planId);
  };

  const handleBillingCycleChange = (cycle) => {
    setBillingCycle(cycle);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const calculateSavings = (monthlyPrice, yearlyPrice) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - yearlyPrice;
    return Math.round((savings / monthlyTotal) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Plans</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your subscription and billing information
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download size={16} className="mr-2" />
            Download Invoice
          </button>
        </div>
      </div>

      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-xl p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
              <Crown size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Current Plan: {currentPlan.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {formatPrice(currentPlan.price)}/{currentPlan.cycle}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Active
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Next billing: {new Date(currentPlan.nextBilling).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Your plan includes:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {currentPlan.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Check size={16} className="text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Billing Cycle Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <div className="flex">
            <button
              onClick={() => handleBillingCycleChange('monthly')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => handleBillingCycleChange('yearly')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors relative',
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              Yearly
              {billingCycle === 'yearly' && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                  Save 20%
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrentPlan = plan.id === selectedPlan;
          const isPopular = plan.popular;
          
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: plans.indexOf(plan) * 0.1 }}
              className={cn(
                'relative bg-white dark:bg-gray-800 border rounded-xl p-6 transition-all duration-200',
                isCurrentPlan
                  ? 'border-blue-500 shadow-lg shadow-blue-500/25'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg'
              )}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                    <Star size={12} className="mr-1" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  {plan.description}
                </p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(plan.price[billingCycle])}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                </div>
                {billingCycle === 'yearly' && plan.price.monthly * 12 > plan.price.yearly && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Save {calculateSavings(plan.price.monthly, plan.price.yearly)}% with yearly billing
                  </p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white">Features:</h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                  </div>
                ))}
                {plan.limitations.length > 0 && (
                  <>
                    <h4 className="font-medium text-gray-900 dark:text-white mt-4">Limitations:</h4>
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <X size={16} className="text-red-500 flex-shrink-0" />
                        <span className="text-sm text-gray-500 dark:text-gray-500">{limitation}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <button
                onClick={() => handlePlanChange(plan.id)}
                className={cn(
                  'w-full py-3 px-4 rounded-lg font-medium transition-all duration-200',
                  isCurrentPlan
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {isCurrentPlan ? 'Current Plan' : 'Choose Plan'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Manage your payment methods and billing information
          </p>
          <button className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
            Manage Payment Methods
            <ArrowRight size={16} className="ml-1" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <Headphones size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Need Help?</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get in touch with our support team for billing questions
          </p>
          <button className="inline-flex items-center text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300">
            Contact Support
            <ArrowRight size={16} className="ml-1" />
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default Billing; 