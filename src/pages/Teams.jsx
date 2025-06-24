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
  Users,
  UserPlus,
  Settings,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Activity,
  Award,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Building,
  MapPin,
  Shield,
  Zap,
  Target
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

/**
 * Teams page component with comprehensive team management functionality
 */
const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department: '',
    location: '',
    lead: '',
    members: []
  });

  // Mock teams data
  const mockTeams = [
    {
      id: 1,
      name: 'IT Support Team',
      description: 'Primary IT support team handling hardware and software issues',
      department: 'Information Technology',
      location: 'New York',
      lead: 'Sarah Johnson',
      members: [
        { id: 1, name: 'Sarah Johnson', role: 'Team Lead', avatar: null, status: 'online' },
        { id: 2, name: 'Mike Chen', role: 'Senior Support', avatar: null, status: 'online' },
        { id: 3, name: 'Emma Davis', role: 'Support Specialist', avatar: null, status: 'away' },
        { id: 4, name: 'John Smith', role: 'Support Specialist', avatar: null, status: 'offline' }
      ],
      totalMembers: 4,
      activeMembers: 2,
      ticketsHandled: 156,
      avgResolutionTime: 3.2,
      satisfactionScore: 4.8,
      status: 'active',
      createdAt: '2023-01-15',
      recentActivity: [
        { action: 'Resolved 5 tickets', timestamp: '2024-01-15T14:30:00Z' },
        { action: 'Team meeting completed', timestamp: '2024-01-15T12:15:00Z' },
        { action: 'New member onboarded', timestamp: '2024-01-15T10:45:00Z' }
      ]
    },
    {
      id: 2,
      name: 'Network Support',
      description: 'Specialized team for network infrastructure and connectivity issues',
      department: 'Information Technology',
      location: 'San Francisco',
      lead: 'Emma Davis',
      members: [
        { id: 3, name: 'Emma Davis', role: 'Team Lead', avatar: null, status: 'online' },
        { id: 5, name: 'David Rodriguez', role: 'Network Engineer', avatar: null, status: 'online' },
        { id: 6, name: 'Lisa Wang', role: 'Network Specialist', avatar: null, status: 'offline' }
      ],
      totalMembers: 3,
      activeMembers: 2,
      ticketsHandled: 89,
      avgResolutionTime: 4.1,
      satisfactionScore: 4.9,
      status: 'active',
      createdAt: '2023-03-20',
      recentActivity: [
        { action: 'Network maintenance completed', timestamp: '2024-01-15T16:20:00Z' },
        { action: 'Critical issue resolved', timestamp: '2024-01-15T14:10:00Z' },
        { action: 'Infrastructure updated', timestamp: '2024-01-15T12:00:00Z' }
      ]
    },
    {
      id: 3,
      name: 'Software Support',
      description: 'Team focused on software installation, configuration, and troubleshooting',
      department: 'Information Technology',
      location: 'Chicago',
      lead: 'Mike Chen',
      members: [
        { id: 2, name: 'Mike Chen', role: 'Team Lead', avatar: null, status: 'online' },
        { id: 7, name: 'Alex Thompson', role: 'Software Engineer', avatar: null, status: 'online' },
        { id: 8, name: 'Maria Garcia', role: 'Software Specialist', avatar: null, status: 'away' }
      ],
      totalMembers: 3,
      activeMembers: 2,
      ticketsHandled: 123,
      avgResolutionTime: 2.8,
      satisfactionScore: 4.7,
      status: 'active',
      createdAt: '2023-06-10',
      recentActivity: [
        { action: 'Software deployment successful', timestamp: '2024-01-15T15:45:00Z' },
        { action: 'Configuration updated', timestamp: '2024-01-15T13:30:00Z' },
        { action: 'Training session completed', timestamp: '2024-01-15T11:20:00Z' }
      ]
    },
    {
      id: 4,
      name: 'Security Team',
      description: 'Cybersecurity and access management team',
      department: 'Information Security',
      location: 'Austin',
      lead: 'John Smith',
      members: [
        { id: 4, name: 'John Smith', role: 'Team Lead', avatar: null, status: 'online' },
        { id: 9, name: 'Chris Wilson', role: 'Security Analyst', avatar: null, status: 'online' },
        { id: 10, name: 'Rachel Brown', role: 'Access Manager', avatar: null, status: 'offline' }
      ],
      totalMembers: 3,
      activeMembers: 2,
      ticketsHandled: 67,
      avgResolutionTime: 5.2,
      satisfactionScore: 4.6,
      status: 'active',
      createdAt: '2023-09-05',
      recentActivity: [
        { action: 'Security audit completed', timestamp: '2024-01-15T17:00:00Z' },
        { action: 'Access permissions updated', timestamp: '2024-01-15T15:30:00Z' },
        { action: 'Threat assessment completed', timestamp: '2024-01-15T13:45:00Z' }
      ]
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTeams(mockTeams);
      setFilteredTeams(mockTeams);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.department.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleViewDetails = (team) => {
    setSelectedTeam(team);
    setShowDetailsModal(true);
  };

  const handleEditTeam = (team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description,
      department: team.department,
      location: team.location,
      lead: team.lead,
      members: team.members
    });
    setShowEditModal(true);
  };

  const handleCreateTeam = () => {
    setFormData({
      name: '',
      description: '',
      department: '',
      location: '',
      lead: '',
      members: []
    });
    setShowCreateModal(true);
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    // Handle form submission
    setShowCreateModal(false);
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="inline-flex items-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Teams
          </h1>
        </div>
        <p className="text-xl text-gray-600 mb-2">Manage your support teams</p>
        <p className="text-gray-500">Organize and coordinate IT support teams for optimal performance</p>
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg"
      >
        <div className="flex items-center space-x-4">
          <Button variant="primary" size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500" onClick={handleCreateTeam}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </motion.div>

      {/* Teams Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredTeams.map((team) => (
          <Card key={team.id} className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
            <div className="p-6">
              {/* Team Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {team.name}
                    </h3>
                    <p className="text-sm text-gray-600">{team.department}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(team.status)}
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Team Description */}
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {team.description}
              </p>

              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{team.totalMembers}</div>
                  <div className="text-xs text-gray-600">Members</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">{team.ticketsHandled}</div>
                  <div className="text-xs text-gray-600">Tickets</div>
                </div>
              </div>

              {/* Team Members Preview */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                <div className="space-y-2">
                  {team.members.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="text-sm text-gray-700">{member.name}</span>
                      </div>
                      {getMemberStatusIcon(member.status)}
                    </div>
                  ))}
                  {team.members.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{team.members.length - 3} more members
                    </div>
                  )}
                </div>
              </div>

              {/* Team Performance */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Avg Resolution Time</span>
                  <span className="font-medium text-gray-800">{team.avgResolutionTime}h</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Satisfaction Score</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="font-medium text-gray-800">{team.satisfactionScore}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleViewDetails(team)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleEditTeam(team)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center text-gray-500 text-sm p-6"
      >
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="font-medium text-gray-600">ResolveMeQ Teams</span>
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        <p className="text-gray-500">Organized teams for efficient IT support</p>
        <p className="mt-1 text-gray-400">© 2024 ResolveMeQ. All rights reserved.</p>
      </motion.div>
    </div>
  );
};

export default Teams; 