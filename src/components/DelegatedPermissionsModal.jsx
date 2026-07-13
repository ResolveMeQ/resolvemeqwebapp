import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Button from './ui/Button';
import { api } from '../services/api';

const EMPTY_PERMISSIONS = {
  manage_playbooks: false,
  manage_members: false,
  manage_integrations: false,
  manage_webhooks: false,
  manage_partner_api: false,
  view_audit_log: false,
};

const DelegatedPermissionsModal = ({
  open,
  member,
  initialPermissions,
  onClose,
  onSave,
  saving = false,
}) => {
  const [scopes, setScopes] = useState([]);
  const [ownerNote, setOwnerNote] = useState('');
  const [permissions, setPermissions] = useState(EMPTY_PERMISSIONS);
  const [loadingScopes, setLoadingScopes] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPermissions({ ...EMPTY_PERMISSIONS, ...(initialPermissions || {}) });
    setLoadingScopes(true);
    api.teams
      .permissionScopes()
      .then((res) => {
        setScopes(res?.scopes || []);
        setOwnerNote(res?.owner_only_note || '');
      })
      .catch(() => {
        setScopes([]);
        setOwnerNote('');
      })
      .finally(() => setLoadingScopes(false));
  }, [open, initialPermissions]);

  if (!open || !member) return null;

  const hasAny = Object.values(permissions).some(Boolean);
  const memberLabel = member.name || member.email || 'Member';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/45">
      <div
        className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delegated-permissions-title"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 id="delegated-permissions-title" className="text-base font-semibold text-gray-900 dark:text-white">
              Assign workspace roles
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {memberLabel} — choose what this person can manage in the workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {loadingScopes ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading permission scopes…</p>
          ) : (
            scopes.map((scope) => (
              <label
                key={scope.key}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={Boolean(permissions[scope.key])}
                  onChange={(e) =>
                    setPermissions((prev) => ({ ...prev, [scope.key]: e.target.checked }))
                  }
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-white">{scope.label}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">{scope.description}</span>
                </span>
              </label>
            ))
          )}
          {ownerNote && (
            <p className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-3">
              {ownerNote}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            loading={saving}
            onClick={() => onSave(permissions)}
          >
            {hasAny ? 'Save permissions' : 'Remove all permissions'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DelegatedPermissionsModal;
