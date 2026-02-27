import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Eye, Users, X, Mail, MapPin, UserPlus } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { api } from '../services/api';

const defaultForm = {
  name: '',
  description: '',
  department: '',
  location: '',
  lead: '',
  members: [],
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
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({ ...defaultForm });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const [activeTeamContext, setActiveTeamContext] = useState(null);

  useEffect(() => {
    loadTeams();
    loadLimits();
    loadInvitations();
  }, []);

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
        is_owner: team.is_owner === true
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
  });

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

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team? This cannot be undone.')) return;
    try {
      setLoading(true);
      await api.teams.delete(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setFilteredTeams(prev => prev.filter(t => t.id !== teamId));
      if (selectedTeam?.id === teamId) closePanel();
      showToast('Team deleted.');
    } catch (error) {
      showToast(error?.message || 'Failed to delete team.', 'error');
    } finally {
      setLoading(false);
    }
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
      showToast(`Invitation sent to ${email}`);
    } catch (error) {
      showToast(error?.message || error?.error || 'Failed to send invitation.', 'error');
    } finally {
      setInvitingTeamId(null);
    }
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

  const handleLeaveTeam = async (teamId) => {
    if (!window.confirm('Leave this team? You can rejoin only if invited again.')) return;
    try {
      setLoading(true);
      await api.teams.leave(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setFilteredTeams(prev => prev.filter(t => t.id !== teamId));
      if (selectedTeam?.id === teamId) closePanel();
      showToast('You left the team.');
    } catch (error) {
      showToast(error?.message || 'Failed to leave team.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (teamId, userId) => {
    if (!window.confirm('Remove this member from the team?')) return;
    try {
      await api.teams.removeMember(teamId, userId);
      const updated = await api.teams.get(teamId);
      const mapped = mapTeamFromApi(updated);
      setTeams(prev => prev.map(t => (t.id === teamId ? mapped : t)));
      setFilteredTeams(prev => prev.map(t => (t.id === teamId ? mapped : t)));
      if (selectedTeam?.id === teamId) setSelectedTeam(mapped);
      showToast('Member removed.');
    } catch (error) {
      showToast(error?.message || 'Failed to remove member.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200'
                : 'bg-green-100 dark:bg-green-900/80 text-green-800 dark:text-green-200'
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Teams</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your support teams</p>
          {activeTeamContext && (
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
              Using: <strong>{activeTeamContext.name}</strong> — switch in the sidebar to change which team&apos;s plan applies to your usage.
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
          <Card className="p-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border-2 border-blue-200 dark:border-blue-700">
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

      {/* Inline Team Management Panel */}
      <AnimatePresence>
        {selectedTeam && (
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
                    {getStatusBadge(selectedTeam.status)}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{selectedTeam.department || '—'} {selectedTeam.location ? ` · ${selectedTeam.location}` : ''}</p>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
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
                      <ul className="space-y-2">
                        {(selectedTeam.members_details || selectedTeam.members || []).map((member) => (
                          <li key={member?.id ?? member?.email} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300 shrink-0">
                                {(member?.name || member?.email || '?').toString().split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{member?.name || member?.email || 'Member'}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{member?.email}</p>
                              </div>
                            </div>
                            {selectedTeam.is_owner && member?.id && String(member.id) !== String(selectedTeam.owner) && (
                              <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 shrink-0" onClick={() => handleRemoveMember(selectedTeam.id, member.id)}>
                                Remove
                              </Button>
                            )}
                          </li>
                        ))}
                        {((selectedTeam.members_details || selectedTeam.members || []).length === 0) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">No members yet.</p>
                        )}
                      </ul>
                    </div>
                    <div>
                      {selectedTeam.is_owner && (
                        <>
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Invite by email
                          </h3>
                          <div className="flex gap-2 mb-4">
                            <input
                              type="email"
                              value={inviteEmail[selectedTeam.id] || ''}
                              onChange={(e) => setInviteEmail(prev => ({ ...prev, [selectedTeam.id]: e.target.value }))}
                              placeholder="colleague@example.com"
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                            />
                            <Button variant="primary" size="sm" onClick={() => handleInvite(selectedTeam.id)} disabled={invitingTeamId === selectedTeam.id} loading={invitingTeamId === selectedTeam.id}>
                              Invite
                            </Button>
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
                            <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400" onClick={() => handleDeleteTeam(selectedTeam.id)}>
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                        {!selectedTeam.is_owner && (
                          <Button variant="outline" size="sm" className="text-amber-600 dark:text-amber-400" onClick={() => handleLeaveTeam(selectedTeam.id)}>
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
    </div>
  );
};

export default Teams; 