import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  Target,
  FileText,
  Send,
} from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import { cn } from '../utils/cn';

/**
 * ResolutionFeedbackForm - Collect detailed feedback on AI-generated resolutions
 * Implements enterprise-grade feedback collection for continuous improvement
 */
const ResolutionFeedbackForm = ({ ticketId, onSubmit, onCancel }) => {
  const [feedback, setFeedback] = useState({
    rating: 0,
    was_helpful: null,
    resolution_time_acceptable: null,
    accuracy_rating: 0,
    completeness_rating: 0,
    clarity_rating: 0,
    comments: '',
    would_recommend: null,
  });
  const [loading, setLoading] = useState(false);

  const handleRatingChange = (field, value) => {
    setFeedback((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(feedback);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      feedback.rating > 0 &&
      feedback.was_helpful !== null &&
      feedback.resolution_time_acceptable !== null &&
      feedback.would_recommend !== null
    );
  };

  const StarRating = ({ value, onChange, label }) => {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
          {label}
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              className="focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            >
              <Star
                className={cn(
                  'w-6 h-6 transition-colors',
                  star <= value
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-gray-300 dark:text-gray-700'
                )}
              />
            </button>
          ))}
        </div>
      </div>
    );
  };

  const YesNoToggle = ({ value, onChange, label, icon: Icon }) => {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
          {Icon && <Icon className="w-3.5 h-3.5 inline mr-1.5" />}
          {label}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg border font-medium text-sm transition-all duration-150',
              value === true
                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-500 ring-2 ring-green-500/30'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-green-500'
            )}
          >
            <ThumbsUp className="w-4 h-4 inline mr-1.5" />
            Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg border font-medium text-sm transition-all duration-150',
              value === false
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-500 ring-2 ring-red-500/30'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-red-500'
            )}
          >
            <ThumbsDown className="w-4 h-4 inline mr-1.5" />
            No
          </button>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Resolution Feedback
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Help us improve by sharing your experience with this AI-generated resolution
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <StarRating
          value={feedback.rating}
          onChange={(value) => handleRatingChange('rating', value)}
          label="Overall Rating"
        />

        {/* Was Helpful Toggle */}
        <YesNoToggle
          value={feedback.was_helpful}
          onChange={(value) => handleRatingChange('was_helpful', value)}
          label="Was this resolution helpful?"
          icon={ThumbsUp}
        />

        {/* Resolution Time */}
        <YesNoToggle
          value={feedback.resolution_time_acceptable}
          onChange={(value) => handleRatingChange('resolution_time_acceptable', value)}
          label="Was the resolution time acceptable?"
          icon={Clock}
        />

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <StarRating
            value={feedback.accuracy_rating}
            onChange={(value) => handleRatingChange('accuracy_rating', value)}
            label="Accuracy"
          />
          <StarRating
            value={feedback.completeness_rating}
            onChange={(value) => handleRatingChange('completeness_rating', value)}
            label="Completeness"
          />
          <StarRating
            value={feedback.clarity_rating}
            onChange={(value) => handleRatingChange('clarity_rating', value)}
            label="Clarity"
          />
        </div>

        {/* Would Recommend */}
        <YesNoToggle
          value={feedback.would_recommend}
          onChange={(value) => handleRatingChange('would_recommend', value)}
          label="Would you recommend this solution to others?"
          icon={Target}
        />

        {/* Comments */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            Additional Comments (Optional)
          </label>
          <textarea
            value={feedback.comments}
            onChange={(e) => handleRatingChange('comments', e.target.value)}
            placeholder="Share any additional thoughts about this resolution..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={!isFormValid() || loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Submitting...
              </div>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ResolutionFeedbackForm;
