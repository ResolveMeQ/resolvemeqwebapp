import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Bell,
  Palette,
  Database,
  Save,
  CheckCircle,
  Plus,
  Edit,
  ExternalLink,
  Clock,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { api } from '../services/api';
import { cn } from '../utils/cn';

/**
 * Settings page component with comprehensive configuration options
 */
const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [profile, setProfile] = useState(null);
  const [profileSettings, setProfileSettings] = useState({ bio: '', location: '', city: '' });

  useEffect(() => {
    loadPreferences();
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.settings.getProfile();
      setProfile(data);
      if (data) {
        setProfileSettings({
          bio: data.bio ?? '',
          location: data.location ?? '',
          city: data.city ?? ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast(error?.message || 'Failed to load profile.', 'error');
    }
  };

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const data = await api.settings.getPreferences();
      setPreferences(data);
      if (data) {
        setNotificationSettings({
          emailNotifications: data.email_notifications ?? true,
          pushNotifications: data.push_notifications ?? true,
          ticketUpdates: data.ticket_updates ?? true,
          systemAlerts: data.system_alerts ?? true,
          dailyDigest: data.daily_digest ?? false
        });
        setGeneralSettings({
          timezone: data.timezone ?? 'UTC',
          language: data.language ?? 'en'
        });
        setAppearanceSettings({
          theme: data.theme ?? 'light'
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      showToast(error?.message || 'Failed to load preferences.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Only API-backed state (profile from GET profile; rest from GET preferences)
  const [generalSettings, setGeneralSettings] = useState({ timezone: '', language: '' });
  const [appearanceSettings, setAppearanceSettings] = useState({ theme: 'light' });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    ticketUpdates: true,
    systemAlerts: true,
    dailyDigest: false
  });
  const [integrations, setIntegrations] = useState([]);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const preferencesData = {
        email_notifications: notificationSettings.emailNotifications,
        push_notifications: notificationSettings.pushNotifications,
        ticket_updates: notificationSettings.ticketUpdates,
        system_alerts: notificationSettings.systemAlerts,
        daily_digest: notificationSettings.dailyDigest,
        timezone: generalSettings.timezone || 'UTC',
        language: generalSettings.language || 'en',
        theme: appearanceSettings.theme || 'light'
      };
      await api.settings.updatePreferences(preferencesData);

      const profilePayload = {
        bio: profileSettings.bio ?? '',
        location: profileSettings.location ?? '',
        city: profileSettings.city ?? ''
      };
      await api.settings.updateProfile(profilePayload);
      setProfile(prev => (prev ? { ...prev, ...profilePayload } : null));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      showToast('Preferences and profile saved. Notification and appearance settings are updated.');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(error?.message || 'Failed to save settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleIntegrationToggle = (integrationId) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: integration.status === 'connected' ? 'disconnected' : 'connected' }
        : integration
    ));
  };

  const getIntegrationStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="warning">Disconnected</Badge>;
      case 'error':
        return <Badge variant="error">Error</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
  const toggleTrackClass = 'w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-900/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600';

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Saved to your account via the backend.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Bio</label>
              <textarea
                value={profileSettings.bio}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, bio: e.target.value }))}
                className={inputClass}
                rows={3}
                placeholder="About yourself"
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input
                type="text"
                value={profileSettings.location}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, location: e.target.value }))}
                className={inputClass}
                placeholder="Location"
              />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input
                type="text"
                value={profileSettings.city}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, city: e.target.value }))}
                className={inputClass}
                placeholder="City"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Regional</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Timezone and language are stored in your preferences.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Timezone</label>
              <select
                value={generalSettings.timezone}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className={inputClass}
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Language</label>
              <select
                value={generalSettings.language}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                className={inputClass}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notifications</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Stored in your account. Change any option below, then click <strong>Save changes</strong> at the top to apply. You’ll see a confirmation when saved.</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Email notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.emailNotifications} onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Push notifications</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.pushNotifications} onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Ticket updates</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Notify when tickets are updated</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.ticketUpdates} onChange={(e) => setNotificationSettings(prev => ({ ...prev, ticketUpdates: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">System alerts</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive system-wide alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.systemAlerts} onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">Daily digest</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receive a daily digest email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.dailyDigest} onChange={(e) => setNotificationSettings(prev => ({ ...prev, dailyDigest: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-6">
      <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Saved to your account preferences.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['light', 'dark', 'auto'].map((themeValue) => (
              <button
                key={themeValue}
                type="button"
                onClick={() => setAppearanceSettings(prev => ({ ...prev, theme: themeValue }))}
                className={cn(
                  'border-2 rounded-lg p-4 text-center cursor-pointer transition-colors',
                  appearanceSettings.theme === themeValue
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className={cn(
                  'w-full h-20 rounded mb-2',
                  themeValue === 'light' && 'bg-gradient-to-br from-gray-100 to-gray-200',
                  themeValue === 'dark' && 'bg-gradient-to-br from-gray-700 to-gray-900',
                  themeValue === 'auto' && 'bg-gradient-to-br from-blue-500 to-purple-600'
                )} />
                <span className="font-medium text-gray-900 dark:text-white capitalize">{themeValue}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );

  const renderIntegrations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Integrations</h3>
        <Button
          variant="primary"
          size="sm"
          type="button"
          onClick={() => showToast('Integrations are not available yet. They will appear here when your admin enables them.')}
        >
          <Plus size={16} className="mr-2" />
          Add Integration
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.length === 0 ? (
          <Card className="md:col-span-2 p-8 text-center border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
            <Database className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">No integrations connected yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">When integrations are enabled, you can connect Slack, Jira, and similar tools here. Click &quot;Add Integration&quot; for more info.</p>
          </Card>
        ) : (
          integrations.map((integration) => (
            <Card key={integration.id} className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 dark:bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">{integration.name.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{integration.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{integration.type.replace('-', ' ')}</p>
                    </div>
                  </div>
                  {getIntegrationStatusBadge(integration.status)}
                </div>

                <div className="space-y-3 mb-4">
                  {integration.lastSync && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock size={14} />
                      <span>Last sync: {new Date(integration.lastSync).toLocaleString()}</span>
                    </div>
                  )}
                  {integration.status === 'connected' && (
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle size={14} />
                      <span>Connected and working</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <Button variant="ghost" size="sm" onClick={() => handleIntegrationToggle(integration.id)}>
                    {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit size={14} />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'integrations':
        return renderIntegrations();
      case 'appearance':
        return renderAppearance();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Configure your preferences and integrations</p>
        </div>
        <div className="flex items-center space-x-3">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 text-green-600 dark:text-green-400"
              >
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Saved!</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={loading}
            loading={loading}
          >
            <Save size={16} className="mr-2" />
            Save changes
          </Button>
        </div>
      </motion.div>

      {/* Settings Tabs */}
      <Card className="border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50">
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Settings Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>

      {toast && (
        <div
          className={cn(
            'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium',
            toast.type === 'error'
              ? 'bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200'
              : 'bg-green-100 dark:bg-green-900/80 text-green-800 dark:text-green-200'
          )}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Settings; 