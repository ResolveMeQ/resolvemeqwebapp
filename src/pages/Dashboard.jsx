import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Star,
  Zap,
  Target,
  Award,
  Shield,
  Headphones,
  Settings,
  FileText,
  Eye,
  TrendingUp,
  TrendingDown,
  MoreHorizontal
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

/**
 * Dashboard page component - Static display of ResolveMeQ IT Helpdesk information
 */
const Dashboard = () => {
  // Mock recent tickets data
  const recentTickets = [
    {
      id: 1,
      title: 'WiFi Connection Issues',
      description: 'Unable to connect to office WiFi network',
      status: 'open',
      priority: 'high',
      assignee: 'Sarah Johnson',
      createdAt: '2 hours ago',
      category: 'Network'
    },
    {
      id: 2,
      title: 'Software Installation Failed',
      description: 'Adobe Creative Suite installation keeps failing',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'Mike Chen',
      createdAt: '4 hours ago',
      category: 'Software'
    },
    {
      id: 3,
      title: 'Laptop Won\'t Start',
      description: 'Computer shows black screen on startup',
      status: 'resolved',
      priority: 'high',
      assignee: 'Emma Davis',
      createdAt: '1 day ago',
      category: 'Hardware'
    },
    {
      id: 4,
      title: 'Email Sync Problems',
      description: 'Outlook not syncing with Exchange server',
      status: 'open',
      priority: 'low',
      assignee: 'Unassigned',
      createdAt: '2 days ago',
      category: 'Email'
    },
    {
      id: 5,
      title: 'Printer Configuration',
      description: 'Need help setting up new office printer',
      status: 'in-progress',
      priority: 'medium',
      assignee: 'John Smith',
      createdAt: '3 days ago',
      category: 'Hardware'
    }
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <Badge variant="warning">Open</Badge>;
      case 'in-progress':
        return <Badge variant="info">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="success">Resolved</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <Badge variant="error" className="bg-red-100 text-red-700">High</Badge>;
      case 'medium':
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-700">Medium</Badge>;
      case 'low':
        return <Badge variant="success" className="bg-green-100 text-green-700">Low</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
          ResolveMeQ
        </h1>
        <p className="text-xl text-gray-600">AI-Powered IT Helpdesk System</p>
        <p className="text-gray-500 mt-2">Streamlining IT support with intelligent automation</p>
      </motion.div>

      {/* Key Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered Resolution</h3>
            <p className="text-gray-600">Intelligent ticket routing and automated problem resolution</p>
          </div>
        </Card>

        <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
              <Headphones className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">24/7 Support</h3>
            <p className="text-gray-600">Round-the-clock IT support with instant response times</p>
          </div>
        </Card>

        <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure & Reliable</h3>
            <p className="text-gray-600">Enterprise-grade security with data protection</p>
          </div>
        </Card>
      </motion.div>

      {/* System Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-6 bg-gradient-to-br from-gray-50 to-blue-50/30 border-blue-200/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
              <Target className="w-4 h-4 text-white" />
            </div>
            System Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800">1,247</div>
              <div className="text-sm text-gray-600">Total Tickets</div>
              <div className="flex items-center justify-center text-green-600 text-sm mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </div>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-600 to-amber-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800">89</div>
              <div className="text-sm text-gray-600">Open Tickets</div>
              <div className="flex items-center justify-center text-red-600 text-sm mt-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                -5%
              </div>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800">23</div>
              <div className="text-sm text-gray-600">Resolved Today</div>
              <div className="flex items-center justify-center text-green-600 text-sm mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +8%
              </div>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-800">12</div>
              <div className="text-sm text-gray-600">Active Agents</div>
              <div className="flex items-center justify-center text-blue-600 text-sm mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +2
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent Tickets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                <FileText className="w-4 h-4 text-white" />
              </div>
              Recent Tickets
            </h2>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentTickets.map((ticket) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-gray-600">{ticket.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{ticket.category}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{ticket.createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(ticket.status)}
                  {getPriorityBadge(ticket.priority)}
                  <div className="text-sm text-gray-600">
                    {ticket.assignee === 'Unassigned' ? (
                      <span className="text-gray-400">Unassigned</span>
                    ) : (
                      <span>{ticket.assignee}</span>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50/30 border-blue-200/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
              <Phone className="w-4 h-4 text-white" />
            </div>
            Get Support
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">1-800-RESOLVE</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">support@resolvemeq.com</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">24/7 Availability</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50/30 border-green-200/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
              <Shield className="w-4 h-4 text-white" />
            </div>
            System Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 transition-colors">
              <span className="text-gray-700 font-medium">Core Services</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 transition-colors">
              <span className="text-gray-700 font-medium">AI Engine</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 transition-colors">
              <span className="text-gray-700 font-medium">Database</span>
              <Badge variant="success">Operational</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/50 transition-colors">
              <span className="text-gray-700 font-medium">API Services</span>
              <Badge variant="success">Operational</Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="text-center text-gray-500 text-sm p-6"
      >
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="font-medium text-gray-600">ResolveMeQ Dashboard</span>
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        <p className="text-gray-500">Empowering IT teams with intelligent automation</p>
        <p className="mt-1 text-gray-400">© 2025 ResolveMeQ. All rights reserved.</p>
      </motion.div>
    </div>
  );
};

export default Dashboard; 