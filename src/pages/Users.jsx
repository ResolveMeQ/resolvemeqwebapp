import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Edit, Users as UsersIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { USER_ROLES } from '../constants';
import { api } from '../services/api';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [panelMode, setPanelMode] = useState('view'); // 'view' | 'edit'
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '', location: '' });
  const [saving, setSaving] = useState(false);
  const [myTeamsAsOwner, setMyTeamsAsOwner] = useState([]);
  const [inviteTeamId, setInviteTeamId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    loadUsers();
    loadMyTeamsAsOwner();
  }, []);

  const loadMyTeamsAsOwner = async () => {
    try {
      const teams = await api.teams.list();
      setMyTeamsAsOwner(Array.isArray(teams) ? teams.filter((t) => t.is_owner) : []);
    } catch {
      setMyTeamsAsOwner([]);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await api.users.listTeamMembers();
      const mapped = Array.isArray(usersData)
        ? usersData.map((u) => ({
            ...u,
            name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username,
            status: u.is_active ? 'active' : 'inactive',
            role: u.is_staff ? USER_ROLES.AGENT : USER_ROLES.USER,
            location: u.profile_location || '',
            department: u.profile_city || '',
            joinDate: u.date_joined,
          }))
        : [];
      setUsers(mapped);
      setFilteredUsers(mapped);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = users;
    const q = (searchQuery || '').toLowerCase();
    if (q) {
      filtered = filtered.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.department || '').toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') filtered = filtered.filter((u) => u.role === roleFilter);
    if (statusFilter !== 'all') filtered = filtered.filter((u) => u.status === statusFilter);
    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter, statusFilter]);

  const getRoleBadge = (role) => {
    if (role === USER_ROLES.ADMIN) return <Badge variant="error">Admin</Badge>;
    if (role === USER_ROLES.AGENT) return <Badge variant="info">Agent</Badge>;
    return <Badge variant="default">User</Badge>;
  };

  const getStatusBadge = (status) => {
    if (status === 'active') return <Badge variant="success">Active</Badge>;
    if (status === 'inactive') return <Badge variant="warning">Inactive</Badge>;
    return <Badge variant="default">{status}</Badge>;
  };

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const openDetail = (user) => {
    setSelectedUser(user);
    setPanelMode('view');
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      department: user.department || '',
      location: user.location || '',
    });
  };

  const closePanel = () => {
    setSelectedUser(null);
    setPanelMode('view');
  };

  const handleInviteToTeam = async (e) => {
    e.preventDefault();
    const teamId = inviteTeamId?.trim();
    const email = inviteEmail?.trim().toLowerCase();
    if (!teamId || !email) return;
    setInviting(true);
    try {
      await api.teams.invite(teamId, email);
      setInviteEmail('');
      showToast(`Invitation sent to ${email}. They will appear here once they accept.`);
    } catch (err) {
      showToast(err?.message || err?.error || 'Failed to send invitation.', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSaving(true);
    try {
      const [first, ...rest] = (editForm.name || '').trim().split(/\s+/);
      const userData = {
        first_name: first || '',
        last_name: rest.join(' ') || '',
        email: editForm.email?.trim() || selectedUser.email,
        profile_location: editForm.location || '',
        profile_city: editForm.department || '',
      };
      await api.users.update(selectedUser.id, userData);
      const updated = { ...selectedUser, ...editForm, name: editForm.name?.trim() || selectedUser.name };
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, ...updated } : u)));
      setFilteredUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, ...updated } : u)));
      setSelectedUser(updated);
      setPanelMode('view');
    } catch (err) {
      showToast(err?.message || 'Failed to update user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Remove this user? This cannot be undone.')) return;
    setDeleteLoading(userId);
    try {
      await api.users.delete(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setFilteredUsers((prev) => prev.filter((u) => u.id !== userId));
      if (selectedUser?.id === userId) closePanel();
      showToast('User removed.');
    } catch (err) {
      showToast(err?.message || 'Failed to delete user.', 'error');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Users</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">People in your teams — invite new members from a team you own.</p>
      </header>

      {/* Invite to team (only if user owns at least one team) */}
      {myTeamsAsOwner.length > 0 && (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-gray-500" />
            Invite to team
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Send an invitation by email. They will appear here after they accept and join the team.
          </p>
          <form onSubmit={handleInviteToTeam} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Team</label>
              <select
                value={inviteTeamId}
                onChange={(e) => setInviteTeamId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                required
              >
                <option value="">Select team</option>
                {myTeamsAsOwner.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[220px]">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                required
              />
            </div>
            <Button type="submit" variant="primary" size="sm" disabled={inviting} loading={inviting}>
              Send invitation
            </Button>
          </form>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">All roles</option>
          <option value={USER_ROLES.ADMIN}>Admin</option>
          <option value={USER_ROLES.AGENT}>Agent</option>
          <option value={USER_ROLES.USER}>User</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => openDetail(user)}
                      className="flex items-center gap-3 text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium shrink-0">
                        {(user.name || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{user.name || '—'}</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.email || '—'}</td>
                  <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                  <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                  <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{formatDate(user.joinDate)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openDetail(user)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={deleteLoading === user.id}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                      >
                        {deleteLoading === user.id ? 'Removing…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && !loading && (
          <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
            {users.length === 0
              ? 'No users in your teams yet. Invite people from a team you own above, or join a team to see members here.'
              : 'No users match your filters.'}
          </div>
        )}
      </Card>

      {/* Inline detail / edit panel */}
      {selectedUser && (
        <Card className="p-6 border-l-4 border-l-blue-500 dark:border-l-blue-600">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {panelMode === 'edit' ? 'Edit user' : selectedUser.name || selectedUser.email}
            </h2>
            <button
              type="button"
              onClick={closePanel}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {panelMode === 'edit' ? (
            <form onSubmit={handleSaveEdit} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
                <input
                  type="text"
                  value={editForm.department}
                  onChange={(e) => setEditForm((p) => ({ ...p, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" disabled={saving} loading={saving}>
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setPanelMode('view')} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Email</span>
                  <span className="text-gray-900 dark:text-white">{selectedUser.email || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Role</span>
                  {getRoleBadge(selectedUser.role)}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Status</span>
                  {getStatusBadge(selectedUser.status)}
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Department</span>
                  <span className="text-gray-900 dark:text-white">{selectedUser.department || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Location</span>
                  <span className="text-gray-900 dark:text-white">{selectedUser.location || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Joined</span>
                  <span className="text-gray-900 dark:text-white">{formatDate(selectedUser.joinDate)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" size="sm" onClick={() => setPanelMode('edit')}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                  loading={deleteLoading === selectedUser.id}
                  disabled={deleteLoading !== null}
                >
                  Delete user
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200'
              : 'bg-green-100 dark:bg-green-900/80 text-green-800 dark:text-green-200'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Users;
