import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  User,
  Shield,
  Mail,
  Phone,
  Calendar,
  Activity,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Settings,
  Key,
  Building,
  MapPin
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { USER_ROLES } from '../constants';

/**
 * Users page component with comprehensive user management functionality
 */
const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    location: '',
    role: USER_ROLES.USER
  });
  const [selectedTickets, setSelectedTickets] = useState([]);

  // Mock user data
  const mockUsers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@company.com',
      role: USER_ROLES.AGENT,
      status: 'active',
      avatar: null,
      phone: '+1 (555) 123-4567',
      department: 'IT Support',
      location: 'New York',
      joinDate: '2023-01-15',
      lastActive: '2024-01-15T14:30:00Z',
      ticketsHandled: 156,
      avgResolutionTime: 3.2,
      satisfactionScore: 4.8,
      permissions: ['tickets:read', 'tickets:write', 'tickets:assign'],
      recentActivity: [
        { action: 'Resolved ticket #1234', timestamp: '2024-01-15T14:30:00Z' },
        { action: 'Assigned ticket #1235', timestamp: '2024-01-15T12:15:00Z' },
        { action: 'Updated ticket #1230', timestamp: '2024-01-15T10:45:00Z' }
      ]
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike.chen@company.com',
      role: USER_ROLES.AGENT,
      status: 'active',
      avatar: null,
      phone: '+1 (555) 234-5678',
      department: 'IT Support',
      location: 'San Francisco',
      joinDate: '2023-03-20',
      lastActive: '2024-01-15T15:45:00Z',
      ticketsHandled: 142,
      avgResolutionTime: 3.8,
      satisfactionScore: 4.6,
      permissions: ['tickets:read', 'tickets:write', 'tickets:assign'],
      recentActivity: [
        { action: 'Created ticket #1236', timestamp: '2024-01-15T15:45:00Z' },
        { action: 'Resolved ticket #1231', timestamp: '2024-01-15T13:20:00Z' },
        { action: 'Updated ticket #1228', timestamp: '2024-01-15T11:30:00Z' }
      ]
    },
    {
      id: 3,
      name: 'Emma Davis',
      email: 'emma.davis@company.com',
      role: USER_ROLES.AGENT,
      status: 'active',
      avatar: null,
      phone: '+1 (555) 345-6789',
      department: 'Network Support',
      location: 'Chicago',
      joinDate: '2023-06-10',
      lastActive: '2024-01-15T16:20:00Z',
      ticketsHandled: 98,
      avgResolutionTime: 4.1,
      satisfactionScore: 4.9,
      permissions: ['tickets:read', 'tickets:write', 'tickets:assign', 'network:admin'],
      recentActivity: [
        { action: 'Network maintenance completed', timestamp: '2024-01-15T16:20:00Z' },
        { action: 'Resolved critical network issue', timestamp: '2024-01-15T14:10:00Z' },
        { action: 'Updated network documentation', timestamp: '2024-01-15T12:00:00Z' }
      ]
    },
    {
      id: 4,
      name: 'John Smith',
      email: 'john.smith@company.com',
      role: USER_ROLES.ADMIN,
      status: 'active',
      avatar: null,
      phone: '+1 (555) 456-7890',
      department: 'IT Management',
      location: 'New York',
      joinDate: '2022-08-15',
      lastActive: '2024-01-15T17:00:00Z',
      ticketsHandled: 89,
      avgResolutionTime: 2.9,
      satisfactionScore: 4.7,
      permissions: ['tickets:read', 'tickets:write', 'tickets:assign', 'users:admin', 'system:admin'],
      recentActivity: [
        { action: 'User permissions updated', timestamp: '2024-01-15T17:00:00Z' },
        { action: 'System configuration changed', timestamp: '2024-01-15T15:30:00Z' },
        { action: 'Team meeting scheduled', timestamp: '2024-01-15T13:45:00Z' }
      ]
    },
    {
      id: 5,
      name: 'Lisa Wang',
      email: 'lisa.wang@company.com',
      role: USER_ROLES.AGENT,
      status: 'inactive',
      avatar: null,
      phone: '+1 (555) 567-8901',
      department: 'Software Support',
      location: 'Austin',
      joinDate: '2023-09-05',
      lastActive: '2024-01-10T09:15:00Z',
      ticketsHandled: 67,
      avgResolutionTime: 4.5,
      satisfactionScore: 4.4,
      permissions: ['tickets:read', 'tickets:write'],
      recentActivity: [
        { action: 'Last login', timestamp: '2024-01-10T09:15:00Z' },
        { action: 'Resolved ticket #1220', timestamp: '2024-01-09T16:30:00Z' },
        { action: 'Updated software documentation', timestamp: '2024-01-08T14:20:00Z' }
      ]
    },
    {
      id: 6,
      name: 'David Rodriguez',
      email: 'david.rodriguez@company.com',
      role: USER_ROLES.USER,
      status: 'active',
      avatar: null,
      phone: '+1 (555) 678-9012',
      department: 'Marketing',
      location: 'Los Angeles',
      joinDate: '2023-11-12',
      lastActive: '2024-01-15T16:45:00Z',
      ticketsHandled: 0,
      avgResolutionTime: 0,
      satisfactionScore: 0,
      permissions: ['tickets:read'],
      recentActivity: [
        { action: 'Created ticket #1237', timestamp: '2024-01-15T16:45:00Z' },
        { action: 'Updated profile information', timestamp: '2024-01-14T10:30:00Z' },
        { action: 'Password changed', timestamp: '2024-01-12T14:15:00Z' }
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Filter users based on search and filters
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, roleFilter, statusFilter]);

  const getRoleBadge = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return <Badge variant="error">Admin</Badge>;
      case USER_ROLES.AGENT:
        return <Badge variant="primary">Agent</Badge>;
      case USER_ROLES.USER:
        return <Badge variant="default">User</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="error">Suspended</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'inactive':
        return <Clock size={16} className="text-yellow-600" />;
      case 'suspended':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      department: user.department || '',
      location: user.location || '',
      role: user.role || USER_ROLES.USER
    });
    setShowEditModal(true);
  };

  const handleDeleteUser = (userId) => {
    // TODO: Implement delete functionality
    console.log('Delete user:', userId);
  };

  const handleCreateUser = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      location: '',
      role: USER_ROLES.USER
    });
    setShowCreateModal(true);
  };

  const handleSubmitUserForm = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      if (showEditModal && selectedUser) {
        // Update existing user
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, ...formData, updatedAt: new Date().toISOString() }
            : user
        ));
        console.log('User updated:', selectedUser.id);
      } else {
        // Create new user
        const newUser = {
          id: Date.now(),
          ...formData,
          status: 'active',
          joinDate: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          ticketsHandled: 0,
          avgResolutionTime: 0,
          satisfactionScore: 0,
          permissions: getDefaultPermissions(formData.role),
          recentActivity: [
            { action: 'Account created', timestamp: new Date().toISOString() }
          ]
        };
        setUsers(prev => [newUser, ...prev]);
        console.log('User created:', newUser.id);
      }
      
      setLoading(false);
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedUser(null);
    }, 1000);
  };

  const getDefaultPermissions = (role) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return ['tickets:read', 'tickets:write', 'tickets:assign', 'users:admin', 'system:admin'];
      case USER_ROLES.AGENT:
        return ['tickets:read', 'tickets:write', 'tickets:assign'];
      case USER_ROLES.USER:
        return ['tickets:read'];
      default:
        return ['tickets:read'];
    }
  };

  const handleUserStatusChange = (userId, newStatus) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: newStatus, updatedAt: new Date().toISOString() }
        : user
    ));
    console.log(`User ${userId} status changed to ${newStatus}`);
  };

  const handleUserRoleChange = (userId, newRole) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { 
            ...user, 
            role: newRole, 
            permissions: getDefaultPermissions(newRole),
            updatedAt: new Date().toISOString() 
          }
        : user
    ));
    console.log(`User ${userId} role changed to ${newRole}`);
  };

  const handleBulkAction = (action) => {
    if (selectedTickets.length === 0) return;
    
    setLoading(true);
    setTimeout(() => {
      switch (action) {
        case 'activate':
          setUsers(prev => prev.map(user => 
            selectedTickets.includes(user.id) 
              ? { ...user, status: 'active', updatedAt: new Date().toISOString() }
              : user
          ));
          break;
        case 'deactivate':
          setUsers(prev => prev.map(user => 
            selectedTickets.includes(user.id) 
              ? { ...user, status: 'inactive', updatedAt: new Date().toISOString() }
              : user
          ));
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedTickets.length} users?`)) {
            setUsers(prev => prev.filter(user => !selectedTickets.includes(user.id)));
          }
          break;
        case 'export':
          const dataStr = JSON.stringify(
            users.filter(user => selectedTickets.includes(user.id)), 
            null, 2
          );
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'users-export.json';
          link.click();
          URL.revokeObjectURL(url);
          break;
        default:
          break;
      }
      
      setSelectedTickets([]);
      setLoading(false);
    }, 1000);
  };

  const handleUserSelect = (userId) => {
    setSelectedTickets(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTickets.length === filteredUsers.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredUsers.map(user => user.id));
    }
  };

  const handleExportUsers = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'all-users.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportUsers = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const importedUsers = JSON.parse(e.target.result);
            setUsers(prev => [...importedUsers, ...prev]);
            console.log('Users imported successfully');
          } catch (error) {
            console.error('Error importing users:', error);
            alert('Error importing users. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse mt-1"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-blue-600">Users</h1>
          <p className="text-gray-600 mt-1">Manage team members and user permissions</p>
        </div>
        <Button 
          variant="primary" 
          size="lg"
          onClick={handleCreateUser}
        >
          <Plus size={16} className="mr-2" />
          Add User
        </Button>
      </motion.div>

      {/* Filters and Search */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Roles</option>
                <option value={USER_ROLES.ADMIN}>Admin</option>
                <option value={USER_ROLES.AGENT}>Agent</option>
                <option value={USER_ROLES.USER}>User</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card variant="elevated" className="p-6 h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1"
                    >
                      <MoreVertical size={16} />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Shield size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{user.department}</span>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <MapPin size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{user.location}</span>
                    </div>
                    {getStatusBadge(user.status)}
                  </div>

                  <div className="flex items-center space-x-1">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Joined {formatDate(user.joinDate)}</span>
                  </div>
                </div>

                {user.role === USER_ROLES.AGENT && (
                  <div className="border-t border-gray-100 pt-4 mb-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{user.ticketsHandled}</p>
                        <p className="text-xs text-gray-600">Tickets</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{user.avgResolutionTime}h</p>
                        <p className="text-xs text-gray-600">Avg Time</p>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{user.satisfactionScore}</p>
                        <p className="text-xs text-gray-600">Rating</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(user)}
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </motion.div>
      )}

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getRoleBadge(selectedUser.role)}
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>

              {/* Contact & Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <div className="mt-1 text-gray-900">{selectedUser.phone}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <div className="mt-1 text-gray-900">{selectedUser.department}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <div className="mt-1 text-gray-900">{selectedUser.location}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Join Date</label>
                  <div className="mt-1 text-gray-900">{formatDate(selectedUser.joinDate)}</div>
                </div>
              </div>

              {/* Performance Metrics (for agents) */}
              {selectedUser.role === USER_ROLES.AGENT && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Performance Metrics</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">{selectedUser.ticketsHandled}</p>
                      <p className="text-sm text-gray-600">Tickets Handled</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{selectedUser.avgResolutionTime}h</p>
                      <p className="text-sm text-gray-600">Avg Resolution</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">{selectedUser.satisfactionScore}</p>
                      <p className="text-sm text-gray-600">Satisfaction</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Permissions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUser.permissions.map((permission, index) => (
                    <Badge key={index} variant="secondary">{permission}</Badge>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  {selectedUser.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-900">{activity.action}</span>
                      <span className="text-xs text-gray-500">{formatDate(activity.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditUser(selectedUser);
                  }}
                >
                  <Edit size={16} className="mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleUserStatusChange(selectedUser.id, selectedUser.status === 'active' ? 'inactive' : 'active')}
                >
                  {selectedUser.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {showEditModal ? 'Edit User' : 'Create New User'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                >
                  ×
                </Button>
              </div>

              <form onSubmit={handleSubmitUserForm} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="user@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <select
                      required
                      value={formData.department || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select department</option>
                      <option value="IT Support">IT Support</option>
                      <option value="Network Support">Network Support</option>
                      <option value="Software Support">Software Support</option>
                      <option value="IT Management">IT Management</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <select
                      required
                      value={formData.location || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select location</option>
                      <option value="New York">New York</option>
                      <option value="San Francisco">San Francisco</option>
                      <option value="Chicago">Chicago</option>
                      <option value="Los Angeles">Los Angeles</option>
                      <option value="Austin">Austin</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      required
                      value={formData.role || USER_ROLES.USER}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={USER_ROLES.USER}>User</option>
                      <option value={USER_ROLES.AGENT}>Agent</option>
                      <option value={USER_ROLES.ADMIN}>Admin</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (showEditModal ? 'Update User' : 'Create User')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Users; 