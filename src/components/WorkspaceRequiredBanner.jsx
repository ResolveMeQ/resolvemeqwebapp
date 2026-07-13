import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import Card from './ui/Card';

/**
 * Shown when a page needs an active workspace but none is selected.
 */
const WorkspaceRequiredBanner = ({ title = 'Select a workspace' }) => (
  <Card className="p-4 mb-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 text-sm text-amber-900 dark:text-amber-200">
    <div className="flex gap-3">
      <Building2 className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-amber-800/90 dark:text-amber-100/80">
          Use the workspace control in the header or sidebar, or open Teams to create one.
        </p>
        <p className="mt-2">
          <Link to="/teams" className="text-primary-700 dark:text-primary-300 font-medium hover:underline">
            Open Teams
          </Link>
        </p>
      </div>
    </div>
  </Card>
);

export default WorkspaceRequiredBanner;
