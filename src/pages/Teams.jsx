import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Users, X, Mail, UserPlus, RefreshCw } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmModal from '../components/ui/ConfirmModal';
import DelegatedPermissionsModal from '../components/DelegatedPermissionsModal';
import { api } from '../services/api';
import { TeamsPageSkeleton } from '../components/ui/Skeleton';

const defaultForm = {
  name: '',
  description: '',
  department: '',
  location: '',
  lead: '',
  members: [],
};

const PERMISSION_SHORT_LABELS = {
  manage_playbooks: 'Playbooks',
  manage_members: 'Members',
  manage_integrations: 'Integrations',
  manage_webhooks: 'Webhooks',
  manage_partner_api: 'Partner API',
  view_audit_log: 'Audit',
};

const activePermissionLabels = (perms) => {
  if (!perms || typeof perms !== 'object') return [];
  return Object.entries(perms)
    .filter(([, enabled]) => enabled)
    .map(([key]) => PERMISSION_SHORT_LABELS[key] || key);
};

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [panelMode, setPanelMode] = useState('view'); // 'view' | 'edit'
  const [teamLimits, setTeamLimits] = useState(null);
  const [invitations, setInvitations] = useState([]);
  const [inviteEmail, setInviteEmail] = useState({});
  const [invitingTeamId, setInvitingTeamId] = useState(null);
  const [acceptLoadingId, setAcceptLoadingId] = useState(null);
  const [declineLoadingId, setDeclineLoadingId] = useState(null);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [resendLoadingId, setResendLoadingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const toastSeq = useRef(0);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const [formData, setFormData] = useState({ ...defaultForm });

  const showToast = useCallback((message, type = 'success') => {
    const id = ++toastSeq.current;
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, 4000);
  }, []);

  const [activeTeamContext, setActiveTeamContext] = useState(null);
  const [mspStatus, setMspStatus] = useState(null);
  const [mspDashboard, setMspDashboard] = useState(null);
  const [mspClientName, setMspClientName] = useState('');
  const [mspLoading, setMspLoading] = useState(false);
  const [mspSaving, setMspSaving] = useState(false);
  const [permModal, setPermModal] = useState(null);
  const [permSaving, setPermSaving] = useState(false);

  const loadMsp = useCallback(async (hubId) => {
    try {
      setMspLoading(true);
      const status = await api.msp.status();
      setMspStatus(status);
      if (status?.enabled && status?.hub?.id) {
        setMspDashboard(await api.msp.dashboard(hubId || status.hub.id));
      } else {
        setMspDashboard(null);
      }
    } catch {
      setMspStatus(null);
      setMspDashboard(null);
    } finally {
      setMspLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeams();
    loadLimits();
    loadInvitations();
    loadMsp();
  }, [loadMsp]);

  useEffect(() => {
    api.settings.getPreferences().then((p) => {
      if (p?.active_team) setActiveTeamContext({ id: p.active_team, name: p.active_team_name || 'Team' });
      else setActiveTeamContext(null);
    }).catch(() => setActiveTeamContext(null));
  }, []);

  const loadInvitations = async () => {
    try {
      const data = await api.teams.invitations();
      setInvitations(Array.isArray(data) ? data : []);
    } catch {
      setInvitations([]);
    }
  };

  const loadSentInvitations = useCallback(async (teamId) => {
    if (!teamId) {
      setSentInvitations([]);
      return;
    }
    try {
      const data = await api.teams.sentInvitations(teamId);
      setSentInvitations(Array.isArray(data) ? data : []);
    } catch {
      setSentInvitations([]);
    }
  }, []);

  useEffect(() => {
    if (selectedTeam?.can_manage_members && selectedTeam?.id) {
      loadSentInvitations(selectedTeam.id);
    } else {
      setSentInvitations([]);
    }
  }, [selectedTeam?.id, selectedTeam?.can_manage_members, loadSentInvitations]);

  const loadLimits = async () => {
    try {
      const data = await api.teams.limits();
      setTeamLimits(data);
    } catch {
      setTeamLimits(null);
    }
  };

  const loadTeams = async () => {
    try {
      setLoading(true);
      const teamsData = await api.teams.list();
      // Map backend data to frontend format
      const mappedTeams = Array.isArray(teamsData) ? teamsData.map(team => ({
        ...team,
        totalMembers: team.member_count || 0,
        activeMembers: team.active_member_count || 0,
        status: team.is_active ? 'active' : 'inactive',
        members: team.members_details || [],
        members_details: team.members_details || [],
        lead_name: team.lead_name || 'No lead assigned',
        lead_id: team.lead,
        is_owner: team.is_owner === true,
        is_workspace_admin: team.is_workspace_admin === true,
        can_manage_members: team.can_manage_members === true,
        team_kind: team.team_kind || 'workspace',
      })) : [];
      setTeams(mappedTeams);
      setFilteredTeams(mappedTeams);
      await loadLimits();
    } catch (error) {
      console.error('Error loading teams:', error);
      setTeams([]);
      setFilteredTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = (searchQuery || '').toLowerCase();
    const filtered = teams.filter(team =>
      (team.name || '').toLowerCase().includes(q) ||
      (team.description || '').toLowerCase().includes(q) ||
      (team.department || '').toLowerCase().includes(q)
    );
    setFilteredTeams(filtered);
  }, [searchQuery, teams]);

  const handleEnableMsp = async (teamId) => {
    try {
      setMspSaving(true);
      await api.msp.enable(teamId);
      showToast('MSP mode enabled for this workspace.');
      await loadMsp(teamId);
      await loadTeams();
    } catch (e) {
      showToast(e?.message || 'Could not enable MSP mode.', 'error');
    } finally {
      setMspSaving(false);
    }
  };

  const handleCreateMspClient = async () => {
    const hubId = mspStatus?.hub?.id;
    if (!hubId || !mspClientName.trim()) return;
    try {
      setMspSaving(true);
      await api.msp.createClient(hubId, { name: mspClientName.trim() });
      setMspClientName('');
      showToast('Client workspace created.');
      await loadMsp(hubId);
      await loadTeams();
    } catch (e) {
      showToast(e?.message || 'Could not create client workspace.', 'error');
    } finally {
      setMspSaving(false);
    }
  };

  const handleSwitchToClient = async (clientId, clientName) => {
    try {
      await api.settings.updatePreferences({ active_team: clientId });
      setActiveTeamContext({ id: clientId, name: clientName });
      showToast(`Switched to ${clientName}.`);
    } catch (e) {
      showToast(e?.message || 'Could not switch workspace.', 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getMemberStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'away':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'offline':
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  const openTeamPanel = (team, mode = 'view') => {
    setSelectedTeam(team);
    setPanelMode(mode);
    if (mode === 'edit') {
      setFormData({
        name: team.name,
        description: team.description || '',
        department: team.department || '',
        location: team.location || '',
        lead: team.lead_id || team.lead || '',
        members: Array.isArray(team.members) ? team.members : [],
      });
    }
  };

  const closePanel = () => {
    setSelectedTeam(null);
    setPanelMode('view');
  };

  const handleCreateTeam = () => {
    if (teamLimits && teamLimits.can_create === false) {
      showToast(`Team limit reached (${teamLimits.current_count}/${teamLimits.max_teams}). Upgrade in Billing.`, 'error');
      return;
    }
    setFormData({ ...defaultForm });
    setShowCreateForm(true);
  };

  const mapTeamFromApi = (t) => ({
    ...t,
    totalMembers: t.member_count || 0,
    activeMembers: t.active_member_count || 0,
    status: t.is_active ? 'active' : 'inactive',
    members: t.members_details || [],
    members_details: t.members_details || [],
    lead_name: t.lead_name || 'No lead assigned',
    lead_id: t.lead,
    is_owner: t.is_owner === true,
    is_workspace_admin: t.is_workspace_admin === true,
    can_manage_members: t.can_manage_members === true,
  });

  const canManageMembers = (team) => Boolean(team?.can_manage_members || team?.is_owner);

  const refreshTeam = async (teamId) => {
    const updated = await api.teams.get(teamId);
    const mapped = mapTeamFromApi(updated);
    setTeams((prev) => prev.map((t) => (t.id === teamId ? mapped : t)));
    setFilteredTeams((prev) => prev.map((t) => (t.id === teamId ? mapped : t)));
    if (selectedTeam?.id === teamId) setSelectedTeam(mapped);
    return mapped;
  };

  const openPermissionsModal = (member) => setPermModal({ member });

  const closePermissionsModal = () => setPermModal(null);

  const handleSavePermissions = async (permissions) => {
    if (!permModal?.member?.id || !selectedTeam?.id) return;
    setPermSaving(true);
    try {
      await api.teams.grantWorkspaceAdmin(selectedTeam.id, permModal.member.id, permissions);
      await refreshTeam(selectedTeam.id);
      showToast('Permissions saved.');
      closePermissionsModal();
    } catch (error) {
      showToast(error?.message || 'Could not save permissions.', 'error');
    } finally {
      setPermSaving(false);
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!(formData.name || '').trim()) {
      showToast('Team name is required.', 'error');
      return;
    }
    setSaving(true);
    try {
      const teamData = {
        name: (formData.name || '').trim(),
        description: (formData.description || '').trim() || undefined,
        department: (formData.department || '').trim() || undefined,
        location: (formData.location || '').trim() || undefined,
        lead: (formData.lead && String(formData.lead).trim() && String(formData.lead).match(/^[0-9a-f-]{36}$/i)) ? formData.lead.trim() : null,
        member_ids: Array.isArray(formData.members) ? formData.members.map(m => m.id || m).filter(Boolean) : [],
      };

      if (panelMode === 'edit' && selectedTeam) {
        const updatedTeam = await api.teams.update(selectedTeam.id, teamData);
        const mapped = mapTeamFromApi(updatedTeam);
        setTeams(prev => prev.map(t => (t.id === selectedTeam.id ? mapped : t)));
        setFilteredTeams(prev => prev.map(t => (t.id === selectedTeam.id ? mapped : t)));
        setSelectedTeam(mapped);
        setPanelMode('view');
        showToast('Team updated.');
      } else {
        const newTeam = await api.teams.create(teamData);
        const mapped = mapTeamFromApi(newTeam);
        setTeams(prev => [mapped, ...prev]);
        setFilteredTeams(prev => [mapped, ...prev]);
        setShowCreateForm(false);
        setFormData({ ...defaultForm });
        showToast('Team created.');
        openTeamPanel(mapped, 'view');
      }
      loadLimits();
    } catch (error) {
      const msg = error?.message || error?.detail || 'Failed to save team.';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTeam = (teamId) => {
    setConfirmModal({
      title: 'Delete this team?',
      description: 'This cannot be undone. Pending invitations for this team will no longer be valid.',
      variant: 'danger',
      confirmLabel: 'Delete team',
      onConfirm: async () => {
        try {
          await api.teams.delete(teamId);
          setTeams((prev) => prev.filter((t) => t.id !== teamId));
          setFilteredTeams((prev) => prev.filter((t) => t.id !== teamId));
          if (selectedTeam?.id === teamId) closePanel();
          showToast('Team deleted.');
        } catch (error) {
          showToast(error?.message || 'Failed to delete team.', 'error');
          throw error;
        }
      },
    });
  };

  const handleInvite = async (teamId) => {
    const email = (inviteEmail[teamId] || '').trim();
    if (!email) {
      showToast('Enter an email address.', 'error');
      return;
    }
    try {
      setInvitingTeamId(teamId);
      await api.teams.invite(teamId, email);
      setInviteEmail(prev => ({ ...prev, [teamId]: '' }));
      showToast(`Invitation sent to ${email}. They will get an email and can accept under Teams.`);
      await loadSentInvitations(teamId);
    } catch (error) {
      showToast(error?.message || error?.error || 'Failed to send invitation.', 'error');
    } finally {
      setInvitingTeamId(null);
    }
  };

  const handleResendInvitation = async (invitationId) => {
    setResendLoadingId(invitationId);
    try {
      await api.teams.resendInvitation(invitationId);
      showToast('Invitation email sent again.');
    } catch (error) {
      showToast(error?.message || 'Could not resend invitation.', 'error');
    } finally {
      setResendLoadingId(null);
    }
  };

  const confirmCancelInvitation = (invitationId, teamId) => {
    setConfirmModal({
      title: 'Remove invitation?',
      description: 'They will no longer be able to accept this invite.',
      variant: 'danger',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        try {
          await api.teams.cancelInvitation(invitationId);
          showToast('Invitation removed.');
          await loadSentInvitations(teamId);
        } catch (error) {
          showToast(error?.message || 'Could not remove invitation.', 'error');
          throw error;
        }
      },
    });
  };

  const handleAcceptInvitation = async (invitationId) => {
    setAcceptLoadingId(invitationId);
    try {
      await api.teams.acceptInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      loadTeams();
      showToast('You joined the team.');
    } catch (error) {
      showToast(error?.message || 'Failed to accept.', 'error');
    } finally {
      setAcceptLoadingId(null);
    }
  };

  const handleDeclineInvitation = async (invitationId) => {
    setDeclineLoadingId(invitationId);
    try {
      await api.teams.declineInvitation(invitationId);
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      showToast('Invitation declined.');
    } catch (error) {
      showToast(error?.message || 'Failed to decline.', 'error');
    } finally {
      setDeclineLoadingId(null);
    }
  };

  const confirmLeaveTeam = (teamId) => {
    setConfirmModal({
      title: 'Leave this team?',
      description: 'You can rejoin only if you are invited again.',
      variant: 'danger',
      confirmLabel: 'Leave team',
      onConfirm: async () => {
        try {
          await api.teams.leave(teamId);
          setTeams((prev) => prev.filter((t) => t.id !== teamId));
          setFilteredTeams((prev) => prev.filter((t) => t.id !== teamId));
          if (selectedTeam?.id === teamId) closePanel();
          showToast('You left the team.');
        } catch (error) {
          showToast(error?.message || 'Failed to leave team.', 'error');
          throw error;
        }
      },
    });
  };

  const confirmRemoveMember = (teamId, userId) => {
    setConfirmModal({
      title: 'Remove this member?',
      description: 'They will lose access to this team until someone invites them again.',
      variant: 'danger',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        try {
          await api.teams.removeMember(teamId, userId);
          await refreshTeam(teamId);
          showToast('Member removed.');
        } catch (error) {
          showToast(error?.message || 'Failed to remove member.', 'error');
          throw error;
        }
      },
    });
  };

  if (loading) {
    return <TeamsPageSkeleton />;
  }

  const toastNode =
    toast &&
    typeof document !== 'undefined' &&
    createPortal(
      <AnimatePresence>
        <motion.div
          key={toast.id}
          role="status"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.2 }}
          className={`fixed left-1/2 -translate-x-1/2 top-[5.5rem] max-w-[min(90vw,28rem)] px-4 py-3 rounded-xl shadow-xl border text-sm font-medium z-[10000] pointer-events-auto ${
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
              : 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
          }`}
        >
          {toast.message}
        </motion.div>
      </AnimatePresence>,
      document.body
    );

  return (
    <div className="space-y-6 p-6">
      {toastNode}
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

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Teams</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your support teams</p>
          {activeTeamContext && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Using: <strong>{activeTeamContext.name}</strong>. Switch in the sidebar to change which team’s plan applies to your usage.
            </p>
          )}
        </div>
      </header>

      {teamLimits && teamLimits.can_create === false && (
        <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
          Team limit reached ({teamLimits.current_count}/{teamLimits.max_teams}). Upgrade in Billing to create more.
        </div>
      )}

      {invitations.length > 0 && (
        <Card className="p-4 border-l-4 border-l-blue-500 dark:border-l-blue-600">
          <div className="flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Team invitations</h2>
          </div>
          <ul className="space-y-2">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{inv.team_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">From {inv.invited_by_name || inv.invited_by_email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleAcceptInvitation(inv.id)} loading={acceptLoadingId === inv.id} disabled={acceptLoadingId !== null || declineLoadingId !== null}>Accept</Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeclineInvitation(inv.id)} loading={declineLoadingId === inv.id} disabled={acceptLoadingId !== null || declineLoadingId !== null}>Decline</Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {mspStatus?.enabled && mspDashboard && (
        <Card className="p-5 border border-primary-200 dark:border-primary-900/50 bg-primary-50/40 dark:bg-primary-950/20">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-primary-900 dark:text-primary-200">MSP clients</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Hub: {mspDashboard.msp_team?.name} — each client has isolated templates, connectors, and tickets.
              </p>
            </div>
            {mspLoading && <Badge variant="warning">Updating…</Badge>}
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              className="input-enterprise max-w-xs"
              placeholder="New client name"
              value={mspClientName}
              onChange={(e) => setMspClientName(e.target.value)}
            />
            <Button variant="primary" size="sm" loading={mspSaving} disabled={!mspClientName.trim()} onClick={handleCreateMspClient}>
              Add client
            </Button>
          </div>
          {mspDashboard.clients?.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-3">Client</th>
                    <th className="py-2 pr-3">Tickets (period)</th>
                    <th className="py-2 pr-3">Open</th>
                    <th className="py-2 pr-3">Workflows</th>
                    <th className="py-2 pr-3">Integrations</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mspDashboard.clients.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                      <td className="py-2 pr-3 tabular-nums">{c.usage?.tickets_created_period ?? 0}</td>
                      <td className="py-2 pr-3 tabular-nums">{c.usage?.tickets_open ?? 0}</td>
                      <td className="py-2 pr-3 tabular-nums">{c.usage?.workflows_started_period ?? 0}</td>
                      <td className="py-2 pr-3 text-xs">{(c.usage?.integrations_connected || []).join(', ') || '—'}</td>
                      <td className="py-2">
                        <Button variant="outline" size="sm" type="button" onClick={() => handleSwitchToClient(c.id, c.name)}>
                          Switch
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">No client workspaces yet. Add your first client above.</p>
          )}
        </Card>
      )}

      {!mspStatus?.enabled && teams.some((t) => t.is_owner && t.team_kind !== 'msp_client') && (
        <Card className="p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Manage multiple customer workspaces as an MSP? Enable MSP mode on one of your owned teams.
          </p>
          <div className="flex flex-wrap gap-2">
            {teams.filter((t) => t.is_owner && (!t.team_kind || t.team_kind === 'workspace')).slice(0, 3).map((t) => (
              <Button key={t.id} variant="outline" size="sm" loading={mspSaving} onClick={() => handleEnableMsp(t.id)}>
                Enable MSP on {t.name}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 py-2">
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreateTeam}
          disabled={teamLimits && teamLimits.can_create === false}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create team
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 w-56 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Inline Create Team Form */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <Card className="p-6 border border-primary-200 dark:border-primary-800">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create new team</h2>
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Support Team"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. IT Support"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the team"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 max-w-xs"
                  placeholder="e.g. New York"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" variant="primary" disabled={saving} loading={saving}>
                  Create team
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowCreateForm(false); setFormData({ ...defaultForm }); }} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => (
          <Card
            key={team.id}
            className={`p-5 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTeam?.id === team.id ? 'ring-2 ring-blue-500 dark:ring-blue-400 shadow-md' : ''
            }`}
            onClick={() => openTeamPanel(team, 'view')}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{team.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{team.department || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {team.is_owner && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Owner</span>
                )}
                {getStatusBadge(team.status)}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {team.totalMembers ?? 0} members
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{team.description || 'No description'}</p>
          </Card>
        ))}
      </div>

      {/* Team detail: expanding panel on md+, full-height sheet on mobile */}
      <AnimatePresence>
        {selectedTeam && isDesktop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="p-6 border-l-4 border-l-blue-500 dark:border-l-blue-600">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTeam.name}</h2>
                    {selectedTeam.is_owner && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Owner</span>
                    )}
                    {selectedTeam.is_workspace_admin && !selectedTeam.is_owner && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">Admin</span>
                    )}
                    {getStatusBadge(selectedTeam.status)}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedTeam.department || '—'} {selectedTeam.location ? ` · ${selectedTeam.location}` : ''}</p>
                </div>
                {isDesktop && (
                  <button
                    type="button"
                    onClick={closePanel}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {panelMode === 'edit' ? (
                <form onSubmit={handleSubmitForm} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      placeholder="e.g. Support Team"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" variant="primary" size="sm" disabled={saving} loading={saving}>Save changes</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setPanelMode('view')}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <>
                  {selectedTeam.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{selectedTeam.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Members ({(selectedTeam.members_details || selectedTeam.members || []).length})
                      </h3>
                      {selectedTeam.is_owner && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                          Choose which areas each teammate can manage. Billing, workspace deletion, and granting permissions stay with you.
                        </p>
                      )}
                      <ul className="space-y-2">
                        {(selectedTeam.members_details || selectedTeam.members || []).map((member) => {
                          const isOwnerMember = member?.id && String(member.id) === String(selectedTeam.owner);
                          const showMemberActions = canManageMembers(selectedTeam) && member?.id && !isOwnerMember;
                          return (
                          <li key={member?.id ?? member?.email} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                                {(member?.name || member?.email || '?').toString().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <p className="font-medium text-gray-900 dark:text-white truncate">{member?.name || member?.email || 'Member'}</p>
                                  {isOwnerMember && <Badge variant="primary" size="sm">Owner</Badge>}
                                  {activePermissionLabels(member?.delegated_permissions).map((label) => (
                                    <Badge key={label} variant="secondary" size="sm">{label}</Badge>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member?.email}</p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-1 shrink-0">
                              {selectedTeam.is_owner && showMemberActions && (
                                <Button variant="ghost" size="sm" onClick={() => openPermissionsModal(member)}>
                                  Permissions
                                </Button>
                              )}
                              {showMemberActions && (
                                <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400" onClick={() => confirmRemoveMember(selectedTeam.id, member.id)}>
                                  Remove
                                </Button>
                              )}
                            </div>
                          </li>
                          );
                        })}
                        {((selectedTeam.members_details || selectedTeam.members || []).length === 0) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No members yet.</p>
                        )}
                      </ul>
                    </div>
                    <div>
                      {canManageMembers(selectedTeam) && (
                        <>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Invite by email
                          </h3>
                          <form
                            className="flex flex-col sm:flex-row gap-2 mb-4"
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleInvite(selectedTeam.id);
                            }}
                          >
                            <input
                              type="email"
                              value={inviteEmail[selectedTeam.id] || ''}
                              onChange={(e) => setInviteEmail(prev => ({ ...prev, [selectedTeam.id]: e.target.value }))}
                              placeholder="colleague@example.com"
                              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                            <Button type="submit" variant="primary" size="sm" disabled={invitingTeamId === selectedTeam.id} loading={invitingTeamId === selectedTeam.id}>
                              Send invite
                            </Button>
                          </form>
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                              Pending invitations
                            </h4>
                            {sentInvitations.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 py-1">No pending invites. People you invite appear here until they accept or you remove the invite.</p>
                            ) : (
                              <ul className="space-y-2">
                                {sentInvitations.map((row) => (
                                  <li
                                    key={row.id}
                                    className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{row.email}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Invited {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}</p>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleResendInvitation(row.id)}
                                        loading={resendLoadingId === row.id}
                                        disabled={resendLoadingId !== null}
                                        title="Resend email"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5 sm:mr-1" />
                                        <span className="hidden sm:inline">Resend</span>
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 dark:text-red-400"
                                        onClick={() => confirmCancelInvitation(row.id, selectedTeam.id)}
                                        disabled={resendLoadingId !== null}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </>
                      )}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {selectedTeam.is_owner && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => openTeamPanel(selectedTeam, 'edit')}>
                              <Edit className="w-4 h-4 mr-1" />
                              Edit team
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400" onClick={() => confirmDeleteTeam(selectedTeam.id)}>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                        {!selectedTeam.is_owner && (
                          <Button variant="outline" size="sm" className="text-amber-600 dark:text-amber-400" onClick={() => confirmLeaveTeam(selectedTeam.id)}>
                            Leave team
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedTeam &&
        !isDesktop &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence mode="sync">
            <>
              <motion.div
                key="teams-sheet-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] bg-black/45 dark:bg-black/60"
                onClick={closePanel}
                aria-hidden
              />
              <motion.aside
                key="teams-sheet"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                className="fixed top-0 right-0 z-[70] flex h-[100dvh] max-h-[100dvh] w-full max-w-[100vw] sm:max-w-xl flex-col overflow-hidden border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl"
              >
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
                  <div className="min-w-0 pr-2">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Team details</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedTeam.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closePanel}
                    className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Card className="p-4 sm:p-6 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedTeam.name}</h2>
                          {selectedTeam.is_owner && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                              Owner
                            </span>
                          )}
                          {selectedTeam.is_workspace_admin && !selectedTeam.is_owner && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                              Admin
                            </span>
                          )}
                          {getStatusBadge(selectedTeam.status)}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                          {selectedTeam.department || '—'}
                          {selectedTeam.location ? ` · ${selectedTeam.location}` : ''}
                        </p>
                      </div>
                    </div>

                    {panelMode === 'edit' ? (
                      <form onSubmit={handleSubmitForm} className="space-y-4 max-w-xl">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team name *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            placeholder="e.g. Support Team"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            rows={2}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                            <input
                              type="text"
                              value={formData.department}
                              onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button type="submit" variant="primary" size="sm" disabled={saving} loading={saving}>
                            Save changes
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => setPanelMode('view')}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <>
                        {selectedTeam.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{selectedTeam.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Members ({(selectedTeam.members_details || selectedTeam.members || []).length})
                            </h3>
                            <ul className="space-y-2">
                              {(selectedTeam.members_details || selectedTeam.members || []).map((member) => {
                                const isOwnerMember = member?.id && String(member.id) === String(selectedTeam.owner);
                                const showMemberActions = canManageMembers(selectedTeam) && member?.id && !isOwnerMember;
                                return (
                                <li
                                  key={member?.id ?? member?.email}
                                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                                      {(member?.name || member?.email || '?')
                                        .toString()
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .slice(0, 2)
                                        .toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                          {member?.name || member?.email || 'Member'}
                                        </p>
                                        {isOwnerMember && <Badge variant="primary" size="sm">Owner</Badge>}
                                        {activePermissionLabels(member?.delegated_permissions).map((label) => (
                                          <Badge key={label} variant="secondary" size="sm">{label}</Badge>
                                        ))}
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member?.email}</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1 shrink-0 self-end sm:self-auto">
                                    {selectedTeam.is_owner && showMemberActions && (
                                      <Button variant="ghost" size="sm" onClick={() => openPermissionsModal(member)}>
                                        Permissions
                                      </Button>
                                    )}
                                    {showMemberActions && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 dark:text-red-400"
                                        onClick={() => confirmRemoveMember(selectedTeam.id, member.id)}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </div>
                                </li>
                                );
                              })}
                              {(selectedTeam.members_details || selectedTeam.members || []).length === 0 && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No members yet.</p>
                              )}
                            </ul>
                          </div>
                          <div>
                            {canManageMembers(selectedTeam) && (
                              <>
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                  <UserPlus className="w-4 h-4" />
                                  Invite by email
                                </h3>
                                <form
                                  className="flex flex-col sm:flex-row gap-2 mb-4"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleInvite(selectedTeam.id);
                                  }}
                                >
                                  <input
                                    type="email"
                                    value={inviteEmail[selectedTeam.id] || ''}
                                    onChange={(e) =>
                                      setInviteEmail((prev) => ({ ...prev, [selectedTeam.id]: e.target.value }))
                                    }
                                    placeholder="colleague@example.com"
                                    className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                                  />
                                  <Button
                                    type="submit"
                                    variant="primary"
                                    size="sm"
                                    disabled={invitingTeamId === selectedTeam.id}
                                    loading={invitingTeamId === selectedTeam.id}
                                  >
                                    Send invite
                                  </Button>
                                </form>
                                <div className="mb-4">
                                  <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                                    Pending invitations
                                  </h4>
                                  {sentInvitations.length === 0 ? (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
                                      No pending invites. People you invite appear here until they accept or you remove the invite.
                                    </p>
                                  ) : (
                                    <ul className="space-y-2">
                                      {sentInvitations.map((row) => (
                                        <li
                                          key={row.id}
                                          className="flex flex-wrap items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                                        >
                                          <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                              {row.email}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                              Invited {row.created_at ? new Date(row.created_at).toLocaleString() : '—'}
                                            </p>
                                          </div>
                                          <div className="flex gap-1.5 shrink-0">
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handleResendInvitation(row.id)}
                                              loading={resendLoadingId === row.id}
                                              disabled={resendLoadingId !== null}
                                              title="Resend email"
                                            >
                                              <RefreshCw className="w-3.5 h-3.5 sm:mr-1" />
                                              <span className="hidden sm:inline">Resend</span>
                                            </Button>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              className="text-red-600 dark:text-red-400"
                                              onClick={() => confirmCancelInvitation(row.id, selectedTeam.id)}
                                              disabled={resendLoadingId !== null}
                                            >
                                              Remove
                                            </Button>
                                          </div>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </>
                            )}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                              {selectedTeam.is_owner && (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => openTeamPanel(selectedTeam, 'edit')}>
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit team
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => confirmDeleteTeam(selectedTeam.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </Button>
                                </>
                              )}
                              {!selectedTeam.is_owner && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-amber-600 dark:text-amber-400"
                                  onClick={() => confirmLeaveTeam(selectedTeam.id)}
                                >
                                  Leave team
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              </motion.aside>
            </>
          </AnimatePresence>,
          document.body
        )}

      <DelegatedPermissionsModal
        open={Boolean(permModal?.member)}
        member={permModal?.member}
        initialPermissions={permModal?.member?.delegated_permissions}
        onClose={closePermissionsModal}
        onSave={handleSavePermissions}
        saving={permSaving}
      />
    </div>
  );
};

export default Teams; 