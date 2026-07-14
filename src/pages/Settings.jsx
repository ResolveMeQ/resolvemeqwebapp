import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings as SettingsIcon,
  Bell,
  Palette,
  Database,
  Save,
  CheckCircle,
  PlayCircle,
  MessageSquare,
  Webhook,
  ExternalLink,
  Key,
  Shield,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';
import { api, TokenService } from '../services/api';
import { cn } from '../utils/cn';
import { SettingsPageSkeleton } from '../components/ui/Skeleton';
import { THEME_MODES, DEFAULT_THEME } from '../constants';
import { normalizeTheme, hasLocalTheme, getLocalTheme } from '../utils/theme';

/**
 * Settings page component with comprehensive configuration options
 * @param {{ initialTab?: string }} props
 */
const Settings = ({ initialTab = 'general', onThemeChange, theme }) => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);
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
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          bio: data.bio ?? '',
          location: data.location ?? '',
          city: data.city ?? '',
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
        const effectiveTheme = theme ?? (hasLocalTheme() ? getLocalTheme() : (data.theme ?? DEFAULT_THEME));
        const selectedTheme = normalizeTheme(effectiveTheme);
        setNotificationSettings({
          emailNotifications: data.email_notifications ?? true,
          pushNotifications: data.push_notifications ?? true,
          ticketUpdates: data.ticket_updates ?? true,
          systemAlerts: data.system_alerts ?? true,
          dailyDigest: data.daily_digest ?? false,
          communityNewQuestions: data.community_new_questions ?? true,
          communityAnswers: data.community_answers ?? true,
          communityComments: data.community_comments ?? true,
          communityMentions: data.community_mentions ?? true,
        });
        setGeneralSettings({
          timezone: data.timezone ?? 'UTC',
          language: data.language ?? 'en'
        });
        setAppearanceSettings({
          theme: selectedTheme
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      showToast(error?.message || 'Failed to load preferences.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [generalSettings, setGeneralSettings] = useState({ timezone: '', language: '' });
  const [appearanceSettings, setAppearanceSettings] = useState({ theme: DEFAULT_THEME });
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    ticketUpdates: true,
    systemAlerts: true,
    dailyDigest: false,
    communityNewQuestions: true,
    communityAnswers: true,
    communityComments: true,
    communityMentions: true,
  });
  const [slackStatus, setSlackStatus] = useState(null);
  const [slackStatusLoading, setSlackStatusLoading] = useState(false);
  const [slackConnecting, setSlackConnecting] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  const [slackDisconnecting, setSlackDisconnecting] = useState(false);
  const [teamsStatus, setTeamsStatus] = useState(null);
  const [teamsStatusLoading, setTeamsStatusLoading] = useState(false);
  const [teamsLinking, setTeamsLinking] = useState(false);
  const [teamsDisconnecting, setTeamsDisconnecting] = useState(false);
  const [teamsLinkInfo, setTeamsLinkInfo] = useState(null);
  const [webhooks, setWebhooks] = useState([]);
  const [webhookEvents, setWebhookEvents] = useState([]);
  const [webhookCanManage, setWebhookCanManage] = useState(false);
  const [webhooksLoading, setWebhooksLoading] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookForm, setWebhookForm] = useState({ name: '', url: '', events: [] });
  const [webhookSecret, setWebhookSecret] = useState(null);
  const [webhookDeliveries, setWebhookDeliveries] = useState([]);
  const [partnerKeys, setPartnerKeys] = useState([]);
  const [partnerKeysLoading, setPartnerKeysLoading] = useState(false);
  const [partnerKeySaving, setPartnerKeySaving] = useState(false);
  const [partnerKeyName, setPartnerKeyName] = useState('');
  const [partnerKeySecret, setPartnerKeySecret] = useState(null);
  const [workspacePermissions, setWorkspacePermissions] = useState(null);
  const [permissionsLoadError, setPermissionsLoadError] = useState(false);
  const loadWorkspacePermissions = useCallback(async (teamId) => {
    if (!teamId) {
      setWorkspacePermissions(null);
      setPermissionsLoadError(false);
      return;
    }
    try {
      const team = await api.teams.get(teamId);
      setWorkspacePermissions(team?.workspace_permissions || null);
      setPermissionsLoadError(false);
    } catch {
      setWorkspacePermissions(null);
      setPermissionsLoadError(true);
    }
  }, []);

  useEffect(() => {
    loadWorkspacePermissions(preferences?.active_team);
  }, [preferences?.active_team, loadWorkspacePermissions]);

  const canManageIntegrations = Boolean(workspacePermissions?.manage_integrations);
  const canManagePartnerApi = Boolean(workspacePermissions?.manage_partner_api);
  const canViewAuditLog = Boolean(workspacePermissions?.view_audit_log);

  const [oktaStatus, setOktaStatus] = useState(null);
  const [oktaStatusLoading, setOktaStatusLoading] = useState(false);
  const [oktaConnecting, setOktaConnecting] = useState(false);
  const [oktaDisconnecting, setOktaDisconnecting] = useState(false);
  const [oktaDomain, setOktaDomain] = useState('');
  const [googleStatus, setGoogleStatus] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleConnecting, setGoogleConnecting] = useState(false);
  const [googleDisconnecting, setGoogleDisconnecting] = useState(false);
  const [microsoftStatus, setMicrosoftStatus] = useState(null);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [microsoftConnecting, setMicrosoftConnecting] = useState(false);
  const [microsoftDisconnecting, setMicrosoftDisconnecting] = useState(false);
  const [jiraStatus, setJiraStatus] = useState(null);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraSaving, setJiraSaving] = useState(false);
  const [jiraDisconnecting, setJiraDisconnecting] = useState(false);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditExporting, setAuditExporting] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');
  const [jiraForm, setJiraForm] = useState({
    site_url: '',
    user_email: '',
    api_token: '',
    project_key: 'SUP',
    sync_on_escalate: true,
    sync_on_resolve: true,
    resolve_transition: 'Done',
  });

  useEffect(() => {
    if (!theme) return;
    setAppearanceSettings((prev) => ({ ...prev, theme: normalizeTheme(theme) }));
  }, [theme]);

  const handleAppearanceThemeSelect = useCallback(
    (themeValue) => {
      const resolved = normalizeTheme(themeValue);
      setAppearanceSettings((prev) => ({ ...prev, theme: resolved }));
      onThemeChange?.(resolved);
    },
    [onThemeChange]
  );

  const loadSlackStatus = useCallback(async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      setSlackStatus(null);
      return;
    }
    try {
      setSlackStatusLoading(true);
      const s = await api.integrations.slackStatus(teamId);
      setSlackStatus(s);
    } catch (e) {
      console.error('Slack status:', e);
      setSlackStatus({ connected: false, error: true });
    } finally {
      setSlackStatusLoading(false);
    }
  }, [preferences?.active_team]);

  const loadTeamsStatus = useCallback(async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      setTeamsStatus(null);
      return;
    }
    try {
      setTeamsStatusLoading(true);
      const s = await api.integrations.teamsStatus(teamId);
      setTeamsStatus(s);
    } catch (e) {
      console.error('Teams status:', e);
      setTeamsStatus({ connected: false, error: true });
    } finally {
      setTeamsStatusLoading(false);
    }
  }, [preferences?.active_team]);

  const loadWebhooks = useCallback(async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      setWebhooks([]);
      return;
    }
    try {
      setWebhooksLoading(true);
      const [listRes, metaRes, deliveriesRes] = await Promise.all([
        api.integrations.listWebhooks(),
        api.integrations.webhookMetadata().catch(() => ({ events: [] })),
        api.integrations.webhookDeliveries().catch(() => ({ deliveries: [] })),
      ]);
      setWebhooks(listRes?.endpoints || []);
      setWebhookCanManage(Boolean(listRes?.can_manage));
      setWebhookEvents(metaRes?.events || []);
      setWebhookDeliveries(deliveriesRes?.deliveries || []);
    } catch (e) {
      console.error('Webhooks:', e);
      showToast(e?.message || 'Could not load webhooks.', 'error');
    } finally {
      setWebhooksLoading(false);
    }
  }, [preferences?.active_team, showToast]);

  const loadPartnerKeys = useCallback(async () => {
    try {
      setPartnerKeysLoading(true);
      const res = await api.integrations.listPartnerKeys();
      setPartnerKeys(res?.keys || []);
    } catch (e) {
      setPartnerKeys([]);
    } finally {
      setPartnerKeysLoading(false);
    }
  }, []);

  const handleCreatePartnerKey = async () => {
    if (!partnerKeyName.trim()) {
      showToast('Key name is required.', 'error');
      return;
    }
    try {
      setPartnerKeySaving(true);
      const res = await api.integrations.createPartnerKey({ name: partnerKeyName.trim() });
      setPartnerKeySecret(res?.key?.api_key || null);
      setPartnerKeyName('');
      showToast('Partner API key created. Copy it now (it is shown once).');
      await loadPartnerKeys();
    } catch (e) {
      showToast(e?.message || 'Could not create partner API key.', 'error');
    } finally {
      setPartnerKeySaving(false);
    }
  };

  const handleRevokePartnerKey = async (keyId) => {
    try {
      await api.integrations.revokePartnerKey(keyId);
      showToast('Partner API key revoked.');
      await loadPartnerKeys();
    } catch (e) {
      showToast(e?.message || 'Could not revoke key.', 'error');
    }
  };

  const loadOktaStatus = useCallback(async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      setOktaStatus(null);
      return;
    }
    try {
      setOktaStatusLoading(true);
      const s = await api.integrations.oktaStatus(teamId);
      setOktaStatus(s);
      if (s?.okta_domain) setOktaDomain(s.okta_domain);
    } catch (e) {
      console.error('Okta status:', e);
      setOktaStatus({ connected: false, error: true });
    } finally {
      setOktaStatusLoading(false);
    }
  }, [preferences?.active_team]);

  const loadGoogleStatus = useCallback(async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      setGoogleStatus(null);
      return;
    }
    try {
      setGoogleLoading(true);
      setGoogleStatus(await api.integrations.googleWorkspaceStatus(teamId));
    } catch (e) {
      setGoogleStatus({ connected: false, error: true });
    } finally {
      setGoogleLoading(false);
    }
  }, [preferences?.active_team]);

  const loadMicrosoftStatus = useCallback(async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      setMicrosoftStatus(null);
      return;
    }
    try {
      setMicrosoftLoading(true);
      setMicrosoftStatus(await api.integrations.microsoft365Status(teamId));
    } catch (e) {
      setMicrosoftStatus({ connected: false, error: true });
    } finally {
      setMicrosoftLoading(false);
    }
  }, [preferences?.active_team]);

  const loadJiraStatus = useCallback(async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      setJiraStatus(null);
      return;
    }
    try {
      setJiraLoading(true);
      const s = await api.integrations.jiraStatus(teamId);
      setJiraStatus(s);
      const inst = s?.installation;
      if (inst) {
        setJiraForm((prev) => ({
          ...prev,
          site_url: inst.site_url || prev.site_url,
          user_email: inst.user_email || prev.user_email,
          project_key: inst.project_key || prev.project_key,
          sync_on_escalate: inst.sync_on_escalate ?? prev.sync_on_escalate,
          sync_on_resolve: inst.sync_on_resolve ?? prev.sync_on_resolve,
          resolve_transition: inst.resolve_transition || prev.resolve_transition,
        }));
      }
    } catch (e) {
      setJiraStatus({ connected: false, error: true });
    } finally {
      setJiraLoading(false);
    }
  }, [preferences?.active_team]);

  const loadAuditEvents = useCallback(async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      setAuditEvents([]);
      setAuditTotal(0);
      return;
    }
    try {
      setAuditLoading(true);
      const params = { limit: 50 };
      if (auditFilter) params.event_type = auditFilter;
      const data = await api.audit.events(params);
      setAuditEvents(data?.events || []);
      setAuditTotal(data?.total ?? 0);
    } catch (e) {
      setAuditEvents([]);
      setAuditTotal(0);
      if (e?.message && !e.message.includes('403')) {
        showToast(e.message, 'error');
      }
    } finally {
      setAuditLoading(false);
    }
  }, [preferences?.active_team, auditFilter, showToast]);

  const handleExportAudit = async () => {
    try {
      setAuditExporting(true);
      const params = { export_format: 'csv' };
      if (auditFilter) params.event_type = auditFilter;
      await api.audit.export(params);
      showToast('Audit log exported.');
      await loadAuditEvents();
    } catch (e) {
      showToast(e?.message || 'Could not export audit log.', 'error');
    } finally {
      setAuditExporting(false);
    }
  };

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && ['general', 'notifications', 'integrations', 'appearance', 'security'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  useEffect(() => {
    if (location.pathname === '/settings/integrations') {
      setActiveTab('integrations');
    }
  }, [location.pathname]);

  useEffect(() => {
    const slackParam = searchParams.get('slack');
    if (slackParam === 'connected') {
      showToast('Slack workspace connected successfully.');
      loadSlackStatus();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('slack');
          next.delete('reason');
          return next;
        },
        { replace: true }
      );
      return;
    }
    if (slackParam === 'error') {
      const reason = searchParams.get('reason');
      showToast(
        reason ? `Slack connection failed: ${reason}` : 'Slack connection failed. Try again.',
        'error'
      );
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('slack');
          next.delete('reason');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams, loadSlackStatus, showToast]);

  useEffect(() => {
    const oktaParam = searchParams.get('okta');
    if (oktaParam === 'connected') {
      showToast('Okta connected successfully.');
      loadOktaStatus();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete('okta');
          return next;
        },
        { replace: true }
      );
    }
  }, [searchParams, setSearchParams, loadOktaStatus, showToast]);

  useEffect(() => {
    const googleParam = searchParams.get('google');
    if (googleParam === 'connected') {
      showToast('Google Workspace connected successfully.');
      loadGoogleStatus();
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete('google'); return n; }, { replace: true });
    }
    const msParam = searchParams.get('microsoft');
    if (msParam === 'connected') {
      showToast('Microsoft 365 connected successfully.');
      loadMicrosoftStatus();
      setSearchParams((prev) => { const n = new URLSearchParams(prev); n.delete('microsoft'); return n; }, { replace: true });
    }
  }, [searchParams, setSearchParams, loadGoogleStatus, loadMicrosoftStatus, showToast]);

  useEffect(() => {
    if (activeTab !== 'integrations' || !preferences?.active_team) return;
    loadSlackStatus();
    loadTeamsStatus();
    loadWebhooks();
    loadPartnerKeys();
    loadOktaStatus();
    loadGoogleStatus();
    loadMicrosoftStatus();
    loadJiraStatus();
  }, [activeTab, preferences?.active_team, loadSlackStatus, loadTeamsStatus, loadWebhooks, loadPartnerKeys, loadOktaStatus, loadGoogleStatus, loadMicrosoftStatus, loadJiraStatus]);

  useEffect(() => {
    if (activeTab !== 'security' || !preferences?.active_team) return;
    loadAuditEvents();
  }, [activeTab, preferences?.active_team, loadAuditEvents]);

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const savedTheme = normalizeTheme(theme ?? appearanceSettings.theme ?? DEFAULT_THEME);
      const preferencesData = {
        email_notifications: notificationSettings.emailNotifications,
        push_notifications: notificationSettings.pushNotifications,
        ticket_updates: notificationSettings.ticketUpdates,
        system_alerts: notificationSettings.systemAlerts,
        daily_digest: notificationSettings.dailyDigest,
        community_new_questions: notificationSettings.communityNewQuestions,
        community_answers: notificationSettings.communityAnswers,
        community_comments: notificationSettings.communityComments,
        community_mentions: notificationSettings.communityMentions,
        timezone: generalSettings.timezone || 'UTC',
        language: generalSettings.language || 'en',
        theme: savedTheme,
      };
      await api.settings.updatePreferences(preferencesData);
      onThemeChange?.(savedTheme);

      const profilePayload = {
        first_name: profileSettings.first_name ?? '',
        last_name: profileSettings.last_name ?? '',
        bio: profileSettings.bio ?? '',
        location: profileSettings.location ?? '',
        city: profileSettings.city ?? '',
      };
      await api.settings.updateProfile(profilePayload);
      setProfile((prev) => (prev ? { ...prev, ...profilePayload } : null));

      try {
        const me = await api.auth.getCurrentUser();
        TokenService.setUser(me);
      } catch {
        /* header name updates on next navigation if profile fetch fails */
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      showToast('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast(error?.message || 'Failed to save settings.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmDisconnectSlack = () => {
    const teamId = preferences?.active_team;
    if (!teamId) return;
    setConfirmModal({
      title: 'Disconnect Slack?',
      description: 'Ticket notifications and slash commands for this workspace will stop working until you reconnect.',
      variant: 'danger',
      confirmLabel: 'Disconnect',
      onConfirm: async () => {
        try {
          setSlackDisconnecting(true);
          await api.integrations.slackDisconnect(teamId);
          showToast('Slack disconnected for this workspace.');
          await loadSlackStatus();
        } catch (e) {
          showToast(e?.message || 'Could not disconnect Slack.', 'error');
          throw e;
        } finally {
          setSlackDisconnecting(false);
        }
      },
    });
  };

  const handleConnectSlack = async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      showToast('Choose an active workspace in the sidebar, then try again.', 'error');
      return;
    }
    try {
      setSlackConnecting(true);
      const url = await api.integrations.slackAuthorizeUrl(teamId);
      window.location.assign(url);
    } catch (e) {
      showToast(e?.message || 'Could not start Slack connection.', 'error');
      setSlackConnecting(false);
    }
  };

  const handleConnectTeams = async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      showToast('Choose an active workspace in the sidebar, then try again.', 'error');
      return;
    }
    try {
      setTeamsLinking(true);
      const data = await api.integrations.teamsLinkStart(teamId);
      setTeamsLinkInfo(data);
      showToast('Link code generated. Follow the steps in Teams.', 'success');
    } catch (e) {
      showToast(e?.message || 'Could not start Teams linking.', 'error');
    } finally {
      setTeamsLinking(false);
    }
  };

  const confirmDisconnectTeams = () => {
    const teamId = preferences?.active_team;
    if (!teamId) return;
    setConfirmModal({
      title: 'Disconnect Microsoft Teams?',
      description: 'Ticket notifications and bot commands for this workspace will stop working until you reconnect.',
      variant: 'danger',
      confirmLabel: 'Disconnect',
      onConfirm: async () => {
        try {
          setTeamsDisconnecting(true);
          await api.integrations.teamsDisconnect(teamId);
          setTeamsLinkInfo(null);
          showToast('Microsoft Teams disconnected for this workspace.');
          await loadTeamsStatus();
        } catch (e) {
          showToast(e?.message || 'Could not disconnect Teams.', 'error');
          throw e;
        } finally {
          setTeamsDisconnecting(false);
        }
      },
    });
  };

  const handleCreateWebhook = async () => {
    if (!webhookForm.url?.trim()) {
      showToast('Webhook URL is required.', 'error');
      return;
    }
    try {
      setWebhookSaving(true);
      const res = await api.integrations.createWebhook({
        name: webhookForm.name.trim(),
        url: webhookForm.url.trim(),
        events: webhookForm.events,
      });
      setWebhookSecret(res?.endpoint?.secret || null);
      setWebhookForm({ name: '', url: '', events: [] });
      showToast('Webhook endpoint created. Copy the signing secret now (it is shown once).');
      await loadWebhooks();
    } catch (e) {
      showToast(e?.message || 'Could not create webhook.', 'error');
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleTestWebhook = async (endpointId) => {
    try {
      const res = await api.integrations.testWebhook(endpointId, { event_type: 'ticket.created' });
      const status = res?.delivery?.status;
      showToast(status === 'success' ? 'Test webhook delivered.' : 'Test webhook failed.', status === 'success' ? 'success' : 'error');
      await loadWebhooks();
    } catch (e) {
      showToast(e?.message || 'Test delivery failed.', 'error');
    }
  };

  const confirmDeleteWebhook = (endpointId) => {
    setConfirmModal({
      title: 'Delete this webhook endpoint?',
      description: 'Events will stop being delivered to this URL immediately.',
      variant: 'danger',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await api.integrations.deleteWebhook(endpointId);
          showToast('Webhook deleted.');
          await loadWebhooks();
        } catch (e) {
          showToast(e?.message || 'Could not delete webhook.', 'error');
          throw e;
        }
      },
    });
  };

  const toggleWebhookEvent = (event) => {
    setWebhookForm((prev) => {
      const events = prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event];
      return { ...prev, events };
    });
  };

  const handleConnectOkta = async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      showToast('Choose an active workspace in the sidebar, then try again.', 'error');
      return;
    }
    if (!oktaDomain.trim()) {
      showToast('Enter your Okta domain (e.g. dev-12345678).', 'error');
      return;
    }
    try {
      setOktaConnecting(true);
      const url = await api.integrations.oktaAuthorizeUrl(teamId, oktaDomain.trim());
      window.location.assign(url);
    } catch (e) {
      showToast(e?.message || 'Could not start Okta connection.', 'error');
      setOktaConnecting(false);
    }
  };

  const confirmDisconnectOkta = () => {
    const teamId = preferences?.active_team;
    if (!teamId) return;
    setConfirmModal({
      title: 'Disconnect Okta?',
      description: 'Workflow auto-checks that rely on Okta (e.g. onboarding account verification) will stop working until you reconnect.',
      variant: 'danger',
      confirmLabel: 'Disconnect',
      onConfirm: async () => {
        try {
          setOktaDisconnecting(true);
          await api.integrations.oktaDisconnect(teamId);
          showToast('Okta disconnected for this workspace.');
          await loadOktaStatus();
        } catch (e) {
          showToast(e?.message || 'Could not disconnect Okta.', 'error');
          throw e;
        } finally {
          setOktaDisconnecting(false);
        }
      },
    });
  };

  const handleConnectGoogle = async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      showToast('Choose an active workspace first.', 'error');
      return;
    }
    try {
      setGoogleConnecting(true);
      window.location.assign(await api.integrations.googleWorkspaceAuthorizeUrl(teamId));
    } catch (e) {
      showToast(e?.message || 'Could not start Google connection.', 'error');
      setGoogleConnecting(false);
    }
  };

  const confirmDisconnectGoogle = () => {
    const teamId = preferences?.active_team;
    if (!teamId) return;
    setConfirmModal({
      title: 'Disconnect Google Workspace?',
      description: 'Workflow auto-checks that rely on Google Workspace will stop working until you reconnect.',
      variant: 'danger',
      confirmLabel: 'Disconnect',
      onConfirm: async () => {
        try {
          setGoogleDisconnecting(true);
          await api.integrations.googleWorkspaceDisconnect(teamId);
          showToast('Google Workspace disconnected.');
          await loadGoogleStatus();
        } catch (e) {
          showToast(e?.message || 'Could not disconnect Google.', 'error');
          throw e;
        } finally {
          setGoogleDisconnecting(false);
        }
      },
    });
  };

  const handleConnectMicrosoft = async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      showToast('Choose an active workspace first.', 'error');
      return;
    }
    try {
      setMicrosoftConnecting(true);
      window.location.assign(await api.integrations.microsoft365AuthorizeUrl(teamId));
    } catch (e) {
      showToast(e?.message || 'Could not start Microsoft connection.', 'error');
      setMicrosoftConnecting(false);
    }
  };

  const confirmDisconnectMicrosoft = () => {
    const teamId = preferences?.active_team;
    if (!teamId) return;
    setConfirmModal({
      title: 'Disconnect Microsoft 365?',
      description: 'Workflow auto-checks that rely on Microsoft 365 will stop working until you reconnect.',
      variant: 'danger',
      confirmLabel: 'Disconnect',
      onConfirm: async () => {
        try {
          setMicrosoftDisconnecting(true);
          await api.integrations.microsoft365Disconnect(teamId);
          showToast('Microsoft 365 disconnected.');
          await loadMicrosoftStatus();
        } catch (e) {
          showToast(e?.message || 'Could not disconnect Microsoft.', 'error');
          throw e;
        } finally {
          setMicrosoftDisconnecting(false);
        }
      },
    });
  };

  const handleSaveJira = async () => {
    const teamId = preferences?.active_team;
    if (!teamId) {
      showToast('Choose an active workspace first.', 'error');
      return;
    }
    if (!jiraForm.site_url.trim() || !jiraForm.user_email.trim()) {
      showToast('Jira site URL and email are required.', 'error');
      return;
    }
    if (!jiraStatus?.connected && !jiraForm.api_token.trim()) {
      showToast('API token is required to connect Jira.', 'error');
      return;
    }
    try {
      setJiraSaving(true);
      const payload = {
        site_url: jiraForm.site_url.trim(),
        user_email: jiraForm.user_email.trim(),
        project_key: jiraForm.project_key.trim() || 'SUP',
        sync_on_escalate: jiraForm.sync_on_escalate,
        sync_on_resolve: jiraForm.sync_on_resolve,
        resolve_transition: jiraForm.resolve_transition.trim() || 'Done',
      };
      if (jiraForm.api_token.trim()) {
        payload.api_token = jiraForm.api_token.trim();
      }
      if (jiraStatus?.connected) {
        await api.integrations.jiraUpdate(teamId, payload);
        showToast('Jira settings updated.');
      } else {
        await api.integrations.jiraConfigure(teamId, payload);
        showToast('Jira connected.');
      }
      setJiraForm((p) => ({ ...p, api_token: '' }));
      await loadJiraStatus();
    } catch (e) {
      showToast(e?.message || 'Could not save Jira settings.', 'error');
    } finally {
      setJiraSaving(false);
    }
  };

  const confirmDisconnectJira = () => {
    const teamId = preferences?.active_team;
    if (!teamId) return;
    setConfirmModal({
      title: 'Disconnect Jira?',
      description: 'Escalated tickets will stop syncing to Jira until you reconnect.',
      variant: 'danger',
      confirmLabel: 'Disconnect',
      onConfirm: async () => {
        try {
          setJiraDisconnecting(true);
          await api.integrations.jiraDisconnect(teamId);
          showToast('Jira disconnected.');
          await loadJiraStatus();
        } catch (e) {
          showToast(e?.message || 'Could not disconnect Jira.', 'error');
          throw e;
        } finally {
          setJiraDisconnecting(false);
        }
      },
    });
  };

  const inputClass = 'input-enterprise';
  const labelClass = 'block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wide';
  const toggleTrackClass = 'w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600';

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Profile</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Update your personal information</p>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  type="text"
                  value={profileSettings.first_name}
                  onChange={(e) => setProfileSettings((prev) => ({ ...prev, first_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Jane"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  type="text"
                  value={profileSettings.last_name}
                  onChange={(e) => setProfileSettings((prev) => ({ ...prev, last_name: e.target.value }))}
                  className={inputClass}
                  placeholder="Doe"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                value={profileSettings.bio}
                onChange={(e) => setProfileSettings(prev => ({ ...prev, bio: e.target.value }))}
                className={inputClass}
                rows={3}
                placeholder="Tell us about yourself"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Location</label>
                <input
                  type="text"
                  value={profileSettings.location}
                  onChange={(e) => setProfileSettings(prev => ({ ...prev, location: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g., United States"
                />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input
                  type="text"
                  value={profileSettings.city}
                  onChange={(e) => setProfileSettings(prev => ({ ...prev, city: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g., San Francisco"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Regional Settings</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Configure timezone and language preferences</p>
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
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Notification Preferences</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Manage how you receive notifications</p>
          <div className="space-y-5">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Email notifications</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Receive notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.emailNotifications} onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Push notifications</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.pushNotifications} onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Ticket updates</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Notify when tickets are updated</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.ticketUpdates} onChange={(e) => setNotificationSettings(prev => ({ ...prev, ticketUpdates: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">System alerts</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Receive system-wide alerts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.systemAlerts} onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Daily digest</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Receive a daily summary email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.dailyDigest} onChange={(e) => setNotificationSettings(prev => ({ ...prev, dailyDigest: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Community: new questions</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Notify when teammates ask new community questions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.communityNewQuestions} onChange={(e) => setNotificationSettings(prev => ({ ...prev, communityNewQuestions: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Community: answers</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Notify when your questions get answers or your answers are accepted</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.communityAnswers} onChange={(e) => setNotificationSettings(prev => ({ ...prev, communityAnswers: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Community: comments</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Notify when your community threads receive comments</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.communityComments} onChange={(e) => setNotificationSettings(prev => ({ ...prev, communityComments: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Community: mentions</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Notify when someone @mentions you in community Q&amp;A</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notificationSettings.communityMentions} onChange={(e) => setNotificationSettings(prev => ({ ...prev, communityMentions: e.target.checked }))} className="sr-only peer" />
                <div className={toggleTrackClass} />
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAppearance = () => (
    <div className="space-y-4">
      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Theme</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Choose your preferred interface theme</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['light', 'dark', 'auto'].map((themeValue) => (
              <button
                key={themeValue}
                type="button"
                onClick={() => handleAppearanceThemeSelect(themeValue)}
                className={cn(
                  'border-2 rounded-lg p-4 text-center cursor-pointer transition-colors duration-150',
                  appearanceSettings.theme === themeValue
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className={cn(
                  'w-full h-20 rounded-lg mb-3',
                  themeValue === 'light' && 'bg-gradient-to-br from-gray-100 to-gray-200',
                  themeValue === 'dark' && 'bg-gradient-to-br from-gray-700 to-gray-900',
                  themeValue === 'auto' && 'bg-gradient-to-br from-gray-100 via-gray-400 to-gray-900'
                )} />
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">{themeValue}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Product tour</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Replay the guided introduction to navigation, search, and account controls.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('resolvemeq:start-tour'));
              showToast('Starting product tour…', 'success');
            }}
          >
            <PlayCircle size={16} className="mr-2" />
            Replay product tour
          </Button>
        </div>
      </Card>
    </div>
  );

  const renderIntegrations = () => {
    const teamLabel = preferences?.active_team_name || 'your active workspace';
    const connected = slackStatus?.connected;
    const statusError = slackStatus?.error;
    const teamsConnected = teamsStatus?.connected;
    const teamsStatusError = teamsStatus?.error;

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Integrations</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Link channels to <span className="font-medium text-gray-800 dark:text-gray-200">{teamLabel}</span>
          </p>
        </div>

        {!preferences?.active_team && (
          <Card className="p-4 border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Select a workspace from the sidebar before connecting Slack.
            </p>
          </Card>
        )}

        {preferences?.active_team && permissionsLoadError && (
          <Card className="p-4 border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/30">
            <p className="text-sm text-red-900 dark:text-red-200">
              Could not load workspace permissions. Refresh the page or try again — integration controls stay disabled until permissions load.
            </p>
          </Card>
        )}

        {preferences?.active_team && !permissionsLoadError && !canManageIntegrations && (
          <Card className="p-4 border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              You can view integration status here. Connecting or disconnecting requires the Integrations permission from your workspace owner.
            </p>
          </Card>
        )}

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#4A154B' }}
                >
                  <MessageSquare className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Slack</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-md">
                    Install the ResolveMeQ app in Slack so your team can open tickets from channels and DMs. Tokens are
                    stored per workspace.
                  </p>
                  {slackStatusLoading && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Checking connection…</p>
                  )}
                  {!slackStatusLoading && statusError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Could not load Slack status. Try refreshing.
                    </p>
                  )}
                  {connected && slackStatus?.slack_team_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
                      Workspace {slackStatus.slack_team_id}
                    </p>
                  )}
                  {connected && slackStatus?.updated_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last linked {new Date(slackStatus.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {slackStatusLoading ? (
                  <Badge variant="warning">Checking…</Badge>
                ) : connected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="warning">Not connected</Badge>
                )}
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={!preferences?.active_team || !canManageIntegrations || slackConnecting || slackDisconnecting}
                    loading={slackConnecting}
                    onClick={handleConnectSlack}
                  >
                    {connected ? 'Reconnect Slack' : 'Connect Slack'}
                  </Button>
                  {connected && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      disabled={!preferences?.active_team || !canManageIntegrations || slackConnecting || slackDisconnecting}
                      loading={slackDisconnecting}
                      onClick={confirmDisconnectSlack}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                Using Slack
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc pl-4">
                <li>
                  In any channel or DM, run <code className="font-mono text-[11px]">/resolvemeq</code> to open a ticket
                  form.
                </li>
                <li>
                  Run <code className="font-mono text-[11px]">/resolvemeq status</code> to list your open tickets for
                  this workspace.
                </li>
                <li>Ticket updates, AI replies, and escalations are sent to users via Slack DM when connected.</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: '#464EB8' }}
                >
                  <MessageSquare className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Microsoft Teams</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-md">
                    Add the ResolveMeQ bot to Teams and link it with a one-time code. Ticket updates and workflow
                    alerts are sent to connected users via Teams DM.
                  </p>
                  {teamsStatusLoading && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Checking connection…</p>
                  )}
                  {!teamsStatusLoading && teamsStatusError && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                      Could not load Teams status. Try refreshing.
                    </p>
                  )}
                  {teamsConnected && teamsStatus?.tenant_id && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 font-mono">
                      Tenant {teamsStatus.tenant_id}
                    </p>
                  )}
                  {teamsConnected && teamsStatus?.updated_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Last linked {new Date(teamsStatus.updated_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {teamsStatusLoading ? (
                  <Badge variant="warning">Checking…</Badge>
                ) : teamsConnected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="warning">Not connected</Badge>
                )}
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={!preferences?.active_team || !canManageIntegrations || teamsLinking || teamsDisconnecting}
                    loading={teamsLinking}
                    onClick={handleConnectTeams}
                  >
                    {teamsConnected ? 'Generate new link code' : 'Connect Teams'}
                  </Button>
                  {teamsConnected && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      disabled={!preferences?.active_team || !canManageIntegrations || teamsLinking || teamsDisconnecting}
                      loading={teamsDisconnecting}
                      onClick={confirmDisconnectTeams}
                    >
                      Disconnect
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {teamsLinkInfo?.code && (
              <div className="rounded-lg border border-primary-200 dark:border-primary-900/50 bg-primary-50/60 dark:bg-primary-950/20 p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                  Link code (expires in ~15 minutes)
                </p>
                <p className="text-2xl font-mono font-bold text-primary-700 dark:text-primary-300 tracking-widest">
                  {teamsLinkInfo.code}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {teamsLinkInfo.instructions ||
                    'Add the ResolveMeQ bot to your Teams team, then message it: link CODE'}
                </p>
                <Button variant="outline" size="sm" type="button" onClick={() => loadTeamsStatus()}>
                  I linked Teams — refresh status
                </Button>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                Using Teams
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5 list-disc pl-4">
                <li>Message the bot to open tickets and check status from Teams.</li>
                <li>AI replies, escalations, and workflow step alerts arrive in Teams DM when linked.</li>
                <li>Use the link code above once per workspace to attach your Teams tenant.</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-sky-700">
                  <Shield className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Okta</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-md">
                    OAuth read access for workflow auto_check steps (user exists, group membership).
                    Requires an Okta OIDC app with redirect URI pointing to this API.
                  </p>
                  {oktaStatusLoading && (
                    <p className="text-xs text-gray-500 mt-2">Checking connection…</p>
                  )}
                  {oktaStatus?.connected && oktaStatus?.okta_domain && (
                    <p className="text-xs text-gray-500 mt-2 font-mono">{oktaStatus.okta_domain}.okta.com</p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {oktaStatusLoading ? (
                  <Badge variant="warning">Checking…</Badge>
                ) : oktaStatus?.connected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="warning">Not connected</Badge>
                )}
              </div>
            </div>
            {!oktaStatus?.connected && (
              <input
                type="text"
                className={inputClass}
                placeholder="Okta domain (e.g. dev-12345678)"
                value={oktaDomain}
                onChange={(e) => setOktaDomain(e.target.value)}
              />
            )}
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="primary"
                size="sm"
                type="button"
                disabled={!preferences?.active_team || !canManageIntegrations || oktaConnecting || oktaDisconnecting}
                loading={oktaConnecting}
                onClick={handleConnectOkta}
              >
                {oktaStatus?.connected ? 'Reconnect Okta' : 'Connect Okta'}
              </Button>
              {oktaStatus?.connected && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  disabled={oktaDisconnecting}
                  loading={oktaDisconnecting}
                  onClick={confirmDisconnectOkta}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="p-6 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Google Workspace</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Directory + licensing read for auto_check steps.
                  </p>
                  {googleStatus?.admin_email && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">{googleStatus.admin_email}</p>
                  )}
                </div>
                {googleLoading ? <Badge variant="warning">…</Badge> : googleStatus?.connected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="warning">Not connected</Badge>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="primary" size="sm" type="button" loading={googleConnecting} disabled={googleDisconnecting || !preferences?.active_team || !canManageIntegrations} onClick={handleConnectGoogle}>
                  {googleStatus?.connected ? 'Reconnect' : 'Connect'}
                </Button>
                {googleStatus?.connected && (
                  <Button variant="outline" size="sm" type="button" loading={googleDisconnecting} disabled={googleConnecting} onClick={confirmDisconnectGoogle}>
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Microsoft 365</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Graph read for user + license auto_check steps.
                  </p>
                  {microsoftStatus?.tenant_id && (
                    <p className="text-xs text-gray-500 mt-1 font-mono">Tenant {microsoftStatus.tenant_id}</p>
                  )}
                </div>
                {microsoftLoading ? <Badge variant="warning">…</Badge> : microsoftStatus?.connected ? (
                  <Badge variant="success">Connected</Badge>
                ) : (
                  <Badge variant="warning">Not connected</Badge>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="primary" size="sm" type="button" loading={microsoftConnecting} disabled={microsoftDisconnecting || !preferences?.active_team || !canManageIntegrations} onClick={handleConnectMicrosoft}>
                  {microsoftStatus?.connected ? 'Reconnect' : 'Connect'}
                </Button>
                {microsoftStatus?.connected && (
                  <Button variant="outline" size="sm" type="button" loading={microsoftDisconnecting} disabled={microsoftConnecting} onClick={confirmDisconnectMicrosoft}>
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-indigo-600">
                  <ExternalLink className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Jira Cloud</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-md">
                    Create a Jira issue when tickets escalate and transition it when resolved.
                    Uses API token auth (Atlassian account email + token).
                  </p>
                  {jiraStatus?.installation?.site_url && (
                    <p className="text-xs text-gray-500 mt-2 font-mono">
                      {jiraStatus.installation.project_key} @ {jiraStatus.installation.site_url}
                    </p>
                  )}
                </div>
              </div>
              {jiraLoading ? (
                <Badge variant="warning">Checking…</Badge>
              ) : jiraStatus?.connected ? (
                <Badge variant="success">Connected</Badge>
              ) : (
                <Badge variant="warning">Not connected</Badge>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="url"
                className={inputClass}
                placeholder="https://your-org.atlassian.net"
                value={jiraForm.site_url}
                onChange={(e) => setJiraForm((p) => ({ ...p, site_url: e.target.value }))}
              />
              <input
                type="text"
                className={inputClass}
                placeholder="Project key (e.g. SUP)"
                value={jiraForm.project_key}
                onChange={(e) => setJiraForm((p) => ({ ...p, project_key: e.target.value }))}
              />
              <input
                type="email"
                className={inputClass}
                placeholder="Atlassian account email"
                value={jiraForm.user_email}
                onChange={(e) => setJiraForm((p) => ({ ...p, user_email: e.target.value }))}
              />
              <input
                type="password"
                className={inputClass}
                placeholder={jiraStatus?.connected ? 'API token (leave blank to keep)' : 'API token'}
                value={jiraForm.api_token}
                onChange={(e) => setJiraForm((p) => ({ ...p, api_token: e.target.value }))}
                autoComplete="off"
              />
              <input
                type="text"
                className={inputClass}
                placeholder="Resolve transition name (e.g. Done)"
                value={jiraForm.resolve_transition}
                onChange={(e) => setJiraForm((p) => ({ ...p, resolve_transition: e.target.value }))}
              />
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={jiraForm.sync_on_escalate}
                  onChange={(e) => setJiraForm((p) => ({ ...p, sync_on_escalate: e.target.checked }))}
                />
                Sync on escalate
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={jiraForm.sync_on_resolve}
                  onChange={(e) => setJiraForm((p) => ({ ...p, sync_on_resolve: e.target.checked }))}
                />
                Sync on resolve
              </label>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="primary"
                size="sm"
                type="button"
                loading={jiraSaving}
                disabled={jiraDisconnecting || !preferences?.active_team || !canManageIntegrations}
                onClick={handleSaveJira}
              >
                {jiraStatus?.connected ? 'Save Jira settings' : 'Connect Jira'}
              </Button>
              {jiraStatus?.connected && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  loading={jiraDisconnecting}
                  disabled={jiraSaving}
                  onClick={confirmDisconnectJira}
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-primary-600">
                  <Key className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Partner API</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-md">
                    Issue API keys for external intake (Make, n8n, custom portals). Base URL: <code className="text-xs">/api/public/v1/</code>
                  </p>
                  {!canManagePartnerApi && preferences?.active_team && (
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
                      View only — ask your workspace owner for Partner API permission to create or revoke keys.
                    </p>
                  )}
                  <a
                    href="https://github.com/ResolveMeQ/ResolveMeQ/blob/main/docs/PUBLIC_API.md"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 mt-2"
                  >
                    API docs <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              {partnerKeysLoading && <Badge variant="warning">Loading…</Badge>}
            </div>
            {partnerKeySecret && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-3">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1">Copy this key now</p>
                <p className="font-mono text-xs break-all">{partnerKeySecret}</p>
                <Button variant="outline" size="sm" type="button" className="mt-2" onClick={() => setPartnerKeySecret(null)}>
                  Dismiss
                </Button>
              </div>
            )}
            {canManagePartnerApi && (
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                className={inputClass}
                placeholder="Key name (e.g. Make.com intake)"
                value={partnerKeyName}
                onChange={(e) => setPartnerKeyName(e.target.value)}
              />
              <Button variant="primary" size="sm" type="button" loading={partnerKeySaving} onClick={handleCreatePartnerKey}>
                Create key
              </Button>
            </div>
            )}
            {partnerKeys.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {partnerKeys.map((k) => (
                  <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{k.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{k.key_prefix}… · {k.is_active ? 'active' : 'revoked'}</p>
                    </div>
                    {k.is_active && canManagePartnerApi && (
                      <Button variant="outline" size="sm" type="button" onClick={() => handleRevokePartnerKey(k.id)}>
                        Revoke
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              !partnerKeysLoading && (
                <p className="text-xs text-gray-500">No partner API keys yet.</p>
              )
            )}
          </div>
        </Card>

        <Card>
          <div className="p-6 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-emerald-600">
                  <Webhook className="w-5 h-5 text-white" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Outbound webhooks</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 max-w-md">
                    HMAC-signed POSTs to Make, n8n, or your own endpoint when tickets and workflows change.
                    Verify with headers <code className="font-mono text-[11px]">X-ResolveMeq-Signature</code> and{' '}
                    <code className="font-mono text-[11px]">X-ResolveMeq-Timestamp</code>.
                  </p>
                </div>
              </div>
              {webhooksLoading && <Badge variant="warning">Loading…</Badge>}
            </div>

            {webhookSecret && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30 p-4">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                  Signing secret (copy now)
                </p>
                <p className="text-sm font-mono break-all mt-1 text-amber-950 dark:text-amber-100">{webhookSecret}</p>
                <Button variant="outline" size="sm" type="button" className="mt-2" onClick={() => setWebhookSecret(null)}>
                  Dismiss
                </Button>
              </div>
            )}

            {webhookCanManage && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                  Add endpoint
                </p>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Name (optional)"
                  value={webhookForm.name}
                  onChange={(e) => setWebhookForm((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  type="url"
                  className={inputClass}
                  placeholder="https://hooks.example.com/..."
                  value={webhookForm.url}
                  onChange={(e) => setWebhookForm((p) => ({ ...p, url: e.target.value }))}
                />
                <div className="flex flex-wrap gap-2">
                  {webhookEvents.map((ev) => (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => toggleWebhookEvent(ev)}
                      className={cn(
                        'px-2 py-1 rounded text-xs border',
                        webhookForm.events.includes(ev)
                          ? 'bg-primary-50 border-primary-300 text-primary-800 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-300'
                          : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      )}
                    >
                      {ev}
                    </button>
                  ))}
                  <span className="text-xs text-gray-500 self-center">Leave empty for all events</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  disabled={!preferences?.active_team || !webhookCanManage || webhookSaving}
                  loading={webhookSaving}
                  onClick={handleCreateWebhook}
                >
                  Add webhook
                </Button>
              </div>
            )}

            {webhooks.length > 0 ? (
              <ul className="space-y-2">
                {webhooks.map((wh) => (
                  <li
                    key={wh.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {wh.name || wh.url}
                      </p>
                      <p className="text-xs text-gray-500 font-mono truncate">{wh.url}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {(wh.events?.length ? wh.events.join(', ') : 'All events')}
                        {wh.is_active ? '' : ' · paused'}
                      </p>
                    </div>
                    {webhookCanManage && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" type="button" onClick={() => handleTestWebhook(wh.id)}>
                          Test
                        </Button>
                        <Button variant="outline" size="sm" type="button" onClick={() => confirmDeleteWebhook(wh.id)}>
                          Delete
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              !webhooksLoading && (
                <p className="text-xs text-gray-500">No webhook endpoints yet.</p>
              )
            )}

            {webhookDeliveries.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/40 p-4">
                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide mb-2">
                  Recent deliveries
                </p>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-32 overflow-y-auto">
                  {webhookDeliveries.slice(0, 8).map((d) => (
                    <li key={d.id} className="font-mono">
                      {d.event_type} → {d.status}
                      {d.response_code ? ` (${d.response_code})` : ''}
                      {d.error_message ? ` — ${d.error_message}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderSecuritySettings = () => (
    <div className="space-y-4">
      {!preferences?.active_team && (
        <Card className="p-4 border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-200">Select a workspace to view security settings.</p>
        </Card>
      )}
      {preferences?.active_team && !canViewAuditLog && (
        <Card className="p-4 border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/30">
          <p className="text-sm text-amber-900 dark:text-amber-200">
            The compliance audit log is available to workspace owners and teammates with Audit log permission.
          </p>
        </Card>
      )}
      {canViewAuditLog && (
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Compliance audit log</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 max-w-2xl">
                Append-only record of security-relevant actions for your workspace. Available to workspace owners for SOC2 and security reviews.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" type="button" loading={auditLoading} onClick={loadAuditEvents}>
                Refresh
              </Button>
              <Button variant="primary" size="sm" type="button" loading={auditExporting} onClick={handleExportAudit}>
                Export CSV
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className={labelClass}>Event type</label>
              <select
                className={inputClass}
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
              >
                <option value="">All events</option>
                <option value="ticket.created">Ticket created</option>
                <option value="ticket.escalated">Ticket escalated</option>
                <option value="ticket.resolved">Ticket resolved</option>
                <option value="workflow.step.completed">Workflow step completed</option>
                <option value="rule.executed">Rule executed</option>
                <option value="rule.created">Rule created</option>
                <option value="rule.updated">Rule updated</option>
                <option value="rule.deleted">Rule deleted</option>
                <option value="msp.enabled">MSP enabled</option>
                <option value="msp.client_created">MSP client created</option>
                <option value="audit.exported">Audit exported</option>
              </select>
            </div>
            <Button variant="outline" size="sm" type="button" onClick={loadAuditEvents}>
              Apply filter
            </Button>
          </div>
          {!preferences?.active_team ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">Select an active workspace in Teams to view its audit log.</p>
          ) : auditLoading ? (
            <p className="text-sm text-gray-500">Loading audit events…</p>
          ) : auditEvents.length ? (
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                    <th className="py-2 px-3">Time</th>
                    <th className="py-2 px-3">Event</th>
                    <th className="py-2 px-3">Actor</th>
                    <th className="py-2 px-3">Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {auditEvents.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-3 text-xs text-gray-500 whitespace-nowrap">
                        {event.created_at ? new Date(event.created_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-2 px-3 font-mono text-xs">{event.event_type}</td>
                      <td className="py-2 px-3 text-xs">{event.actor_email || 'system'}</td>
                      <td className="py-2 px-3">{event.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No audit events yet for this workspace.</p>
          )}
          {auditTotal > auditEvents.length && (
            <p className="text-xs text-gray-500">Showing {auditEvents.length} of {auditTotal} events. Export CSV for the full set (up to 10,000).</p>
          )}
        </div>
      </Card>
      )}
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
      case 'security':
        return renderSecuritySettings();
      case 'appearance':
        return renderAppearance();
      default:
        return renderGeneralSettings();
    }
  };

  if (loading && preferences === null) {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="space-y-6">
      <ConfirmModal
        open={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title}
        description={confirmModal?.description}
        variant={confirmModal?.variant}
        confirmLabel={confirmModal?.confirmLabel}
        cancelLabel={confirmModal?.cancelLabel}
        onConfirm={confirmModal?.onConfirm}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your account preferences and integrations</p>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 text-green-600 dark:text-green-400"
              >
                <CheckCircle size={16} />
                <span className="text-sm font-medium">Saved</span>
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
      </div>

      <Card>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                  activeTab === tab.id
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <tab.icon size={16} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderContent()}
      </motion.div>

      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium',
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/80 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/80 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
          )}
        >
          {toast.message}
        </motion.div>
      )}
    </div>
  );
};

export default Settings;
