import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  Activity,
  Calendar,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  MessageSquare,
  Star,
  Target,
  Award,
  Zap,
  Info,
  TrendingUp,
  TrendingDown,
  Download,
  Share,
  Filter,
  RefreshCw,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

/**
 * Analytics page component - Modern analytics dashboard with glassmorphism effects
 */
const Analytics = () => {
  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <div className="inline-flex items-center space-x-2 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
        </div>
        <p className="text-xl text-gray-600 mb-2">ResolveMeQ Performance Insights</p>
        <p className="text-gray-500">Real-time analytics and AI-powered insights for optimal IT support operations</p>
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg"
      >
        <div className="flex items-center space-x-4">
          <Button variant="primary" size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="success" className="bg-green-100 text-green-700">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Live Data
          </Badge>
          <Button variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/50">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">1,247</div>
            <div className="text-sm text-gray-600 mb-3">Total Tickets</div>
            <div className="flex items-center justify-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +12% this month
            </div>
          </div>
        </Card>

        <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/50">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">94.2%</div>
            <div className="text-sm text-gray-600 mb-3">Resolution Rate</div>
            <div className="flex items-center justify-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +2.1% improvement
            </div>
          </div>
        </Card>

        <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200/50">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">2.3h</div>
            <div className="text-sm text-gray-600 mb-3">Avg Response Time</div>
            <div className="flex items-center justify-center text-green-600 text-sm font-medium">
              <TrendingDown className="w-4 h-4 mr-1" />
              -0.5h faster
            </div>
          </div>
        </Card>

        <Card className="group hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200/50">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
              <Star className="w-8 h-8 text-white" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">4.7/5</div>
            <div className="text-sm text-gray-600 mb-3">Customer Satisfaction</div>
            <div className="flex items-center justify-center text-green-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4 mr-1" />
              +0.2 points
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Analytics Features Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Performance Tracking</h3>
                <p className="text-sm text-gray-600">Real-time metrics and KPIs</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Comprehensive tracking of ticket resolution times, agent performance, and customer satisfaction metrics with AI-powered insights.
            </p>
            <div className="mt-4 flex items-center text-blue-600 text-sm font-medium group-hover:text-blue-700 transition-colors">
              <span>View Details</span>
              <TrendingUp className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <PieChart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Category Analysis</h3>
                <p className="text-sm text-gray-600">Issue type distribution</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Detailed breakdown of support tickets by category, priority, and resolution patterns with predictive analytics.
            </p>
            <div className="mt-4 flex items-center text-green-600 text-sm font-medium group-hover:text-green-700 transition-colors">
              <span>Explore Data</span>
              <PieChart className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </Card>

        <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Trend Analysis</h3>
                <p className="text-sm text-gray-600">Historical data insights</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Long-term trend analysis to identify patterns and optimize support operations with machine learning predictions.
            </p>
            <div className="mt-4 flex items-center text-purple-600 text-sm font-medium group-hover:text-purple-700 transition-colors">
              <span>View Trends</span>
              <Activity className="w-4 h-4 ml-2 group-hover:animate-pulse" />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Data Categories Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card className="p-8 bg-gradient-to-br from-gray-50 to-blue-50/30 border-blue-200/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
              <Target className="w-4 h-4 text-white" />
            </div>
            Data Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Ticket Data</h3>
              <p className="text-sm text-gray-600">Creation, resolution, and status tracking with real-time updates</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Agent Performance</h3>
              <p className="text-sm text-gray-600">Productivity and satisfaction metrics with AI optimization</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Response Times</h3>
              <p className="text-sm text-gray-600">First response and resolution tracking with SLA monitoring</p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Satisfaction</h3>
              <p className="text-sm text-gray-600">Customer feedback and ratings with sentiment analysis</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Reporting & AI Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50/30 border-blue-200/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
              <Download className="w-4 h-4 text-white" />
            </div>
            Reporting Features
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">Daily, weekly, and monthly reports</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Download className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">Export to PDF, CSV, and Excel</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Eye className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">Real-time dashboard views</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Share className="w-5 h-5 text-blue-600" />
              <span className="text-gray-700 font-medium">Automated report distribution</span>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50/30 border-green-200/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
              <Zap className="w-4 h-4 text-white" />
            </div>
            AI Insights
          </h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Zap className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium">Predictive analytics</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Target className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium">Performance optimization</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-gray-700 font-medium">Anomaly detection</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/50 transition-colors">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-gray-700 font-medium">Best practice recommendations</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.0 }}
        className="text-center text-gray-500 text-sm p-6"
      >
        <div className="flex items-center justify-center space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="font-medium text-gray-600">ResolveMeQ Analytics</span>
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
        <p className="text-gray-500">Data-driven insights for better IT support operations</p>
        <p className="mt-1 text-gray-400">© 2024 ResolveMeQ. All rights reserved.</p>
      </motion.div>
    </div>
  );
};

export default Analytics; 