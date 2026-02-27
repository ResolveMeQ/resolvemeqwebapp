import React, { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import Button from './ui/Button';

/**
 * ResolutionFeedback Component
 * Allows users to provide feedback on autonomous resolutions
 */
const ResolutionFeedback = ({ ticketId, onFeedbackSubmitted }) => {
  const [satisfaction, setSatisfaction] = useState(0);
  const [resolved, setResolved] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (resolved === null) {
      alert('Please indicate if your issue was resolved');
      return;
    }

    try {
      setSubmitting(true);
      await api.tickets.submitResolutionFeedback(ticketId, {
        resolution_confirmed: resolved,
        satisfaction_score: satisfaction,
        feedback_text: feedback
      });

      setSubmitted(true);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert(error?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 dark:bg-green-900/20 dark:border-green-800">
        <div className="flex items-center space-x-3">
          <ThumbsUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          <div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              Thank you for your feedback!
            </h3>
            <p className="text-green-700 dark:text-green-300 mt-1">
              Your input helps us improve our AI agent.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-gray-800 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        How did we do?
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Resolution confirmation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Was your issue resolved?
          </label>
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setResolved(true)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md border-2 transition-all ${
                resolved === true
                  ? 'border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-900/30 dark:text-green-300'
                  : 'border-gray-300 hover:border-green-300 dark:border-gray-600 dark:hover:border-green-600'
              }`}
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="font-medium">Yes, it works!</span>
            </button>
            <button
              type="button"
              onClick={() => setResolved(false)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-md border-2 transition-all ${
                resolved === false
                  ? 'border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-900/30 dark:text-red-300'
                  : 'border-gray-300 hover:border-red-300 dark:border-gray-600 dark:hover:border-red-600'
              }`}
            >
              <ThumbsDown className="w-5 h-5" />
              <span className="font-medium">No, still broken</span>
            </button>
          </div>
        </div>

        {/* Satisfaction rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Rate your experience (1-5 stars)
          </label>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setSatisfaction(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= satisfaction
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </button>
            ))}
          </div>
          {satisfaction > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {satisfaction === 1 && 'Poor - Not satisfied'}
              {satisfaction === 2 && 'Fair - Below expectations'}
              {satisfaction === 3 && 'Good - Met expectations'}
              {satisfaction === 4 && 'Very Good - Above expectations'}
              {satisfaction === 5 && 'Excellent - Exceeded expectations'}
            </p>
          )}
        </div>

        {/* Additional feedback */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Additional feedback (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
            rows="4"
            placeholder="Tell us more about your experience..."
          />
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={submitting || resolved === null}
          loading={submitting}
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Submit Feedback
        </Button>
      </form>
    </div>
  );
};

export default ResolutionFeedback;
