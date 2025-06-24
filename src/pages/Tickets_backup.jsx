import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Search, 
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  Send,
  Mic,
  PaperClip,
  Smartphone,
  Monitor,
  Wifi,
  Settings
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { TICKET_STATUS, PRIORITY_LEVELS } from '../constants';

/**
 * ResolveMeQ - AI-Powered IT Helpdesk
 * Primary focus: AI Agent interaction for ticket resolution
 */
const Tickets = () => {
  const [activeTickets, setActiveTickets] = useState([]);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [quickActions, setQuickActions] = useState([
    { id: 1, label: 'My computer won\'t start', icon: Monitor, category: 'hardware' },
    { id: 2, label: 'Internet connection issues', icon: Wifi, category: 'network' },
    { id: 3, label: 'Software not working', icon: Settings, category: 'software' },
    { id: 4, label: 'Mobile device problems', icon: Smartphone, category: 'mobile' }
  ]);

  // AI Agent conversation
  const startAIAgent = (issue = null) => {
    setShowAIAgent(true);
    const welcomeMessage = {
      id: Date.now(),
      type: 'ai',
      message: issue 
        ? `Hi! I'm your AI assistant. I see you're having trouble with "${issue}". Let me help you resolve this step by step.`
        : `Hi! I'm your AI assistant for ResolveMeQ. I'm here to help resolve your IT issues quickly. What can I help you with today?`,
      timestamp: new Date().toISOString(),
      suggestions: issue ? [] : [
        'Hardware problems',
        'Software issues', 
        'Network connectivity',
        'Account access'
      ]
    };
    setAiMessages([welcomeMessage]);
  };

  const sendMessageToAI = () => {
    if (!userMessage.trim()) return;

    const userMsg = {
      id: Date.now(),
      type: 'user',
      message: userMessage,
      timestamp: new Date().toISOString()
    };

    setAiMessages(prev => [...prev, userMsg]);
    setUserMessage('');
    setIsAiTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage);
      setAiMessages(prev => [...prev, aiResponse]);
      setIsAiTyping(false);
    }, 2000);
  };

  const generateAIResponse = (userInput) => {
    const responses = {
      computer: {
        message: "I understand you're having computer issues. Let me run a quick diagnostic. Can you tell me: \n\n1. Is the power button responding?\n2. Do you see any lights on the computer?\n3. When did this problem start?",
        suggestions: ['Power button works', 'No lights visible', 'Started today', 'Need immediate help']
      },
      internet: {
        message: "Let's troubleshoot your internet connection. I'll guide you through some quick fixes:\n\n1. First, let's check if other devices can connect\n2. Try unplugging your router for 30 seconds\n3. Check if the ethernet cable is properly connected",
        suggestions: ['Other devices work fine', 'Router restarted', 'Still not working', 'It\'s working now!']
      },
      software: {
        message: "I'll help you with your software issue. To better assist you:\n\n1. Which software is having problems?\n2. What exactly happens when you try to use it?\n3. Any error messages you're seeing?",
        suggestions: ['Microsoft Office', 'Browser issues', 'Show error message', 'Other software']
      },
      default: {
        message: "I'm analyzing your issue. Based on what you've told me, here are the most likely solutions:\n\n1. Let's start with a basic restart\n2. Check for any recent updates\n3. Verify your permissions\n\nWhich step would you like to try first?",
        suggestions: ['Restart now', 'Check updates', 'Verify permissions', 'None of these help']
      }
    };

    const input = userInput.toLowerCase();
    let response = responses.default;
    
    if (input.includes('computer') || input.includes('laptop') || input.includes('start')) {
      response = responses.computer;
    } else if (input.includes('internet') || input.includes('wifi') || input.includes('connection')) {
      response = responses.internet;
    } else if (input.includes('software') || input.includes('app') || input.includes('program')) {
      response = responses.software;
    }

    return {
      id: Date.now(),
      type: 'ai',
      message: response.message,
      timestamp: new Date().toISOString(),
      suggestions: response.suggestions
    };
  };

  // Simple recent tickets for reference
  const recentTickets = [
    { id: 1, title: 'WiFi Connection Fixed', status: 'resolved', time: '2 hours ago', aiSolved: true },
    { id: 2, title: 'Laptop Startup Issue', status: 'in-progress', time: '1 day ago', aiSolved: false },
    { id: 3, title: 'Software Installation', status: 'resolved', time: '3 days ago', aiSolved: true }
  ];

  useEffect(() => {
    setActiveTickets(recentTickets);
  }, []);

  useEffect(() => {
    // Filter tickets based on search and filters
    let filtered = tickets;

    if (searchQuery) {
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.customerEmail.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.category === categoryFilter);
    }

    setFilteredTickets(filtered);
  }, [tickets, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case TICKET_STATUS.OPEN:
        return <Badge variant="warning">Open</Badge>;
      case TICKET_STATUS.IN_PROGRESS:
        return <Badge variant="primary">In Progress</Badge>;
      case TICKET_STATUS.RESOLVED:
        return <Badge variant="success">Resolved</Badge>;
      case TICKET_STATUS.CLOSED:
        return <Badge variant="default">Closed</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case PRIORITY_LEVELS.CRITICAL:
        return <Badge variant="error">Critical</Badge>;
      case PRIORITY_LEVELS.HIGH:
        return <Badge variant="warning">High</Badge>;
      case PRIORITY_LEVELS.MEDIUM:
        return <Badge variant="primary">Medium</Badge>;
      case PRIORITY_LEVELS.LOW:
        return <Badge variant="default">Low</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
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

  const handleCreateTicket = () => {
    setShowCreateModal(true);
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: PRIORITY_LEVELS.MEDIUM,
      assignedTo: '',
      customerEmail: '',
      customerPhone: ''
    });
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setFormData({
      title: ticket.title,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo,
      customerEmail: ticket.customerEmail,
      customerPhone: ticket.customerPhone
    });
    setShowEditModal(true);
  };

  const handleViewDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  const handleDeleteTicket = (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      setTickets(prev => prev.filter(ticket => ticket.id !== ticketId));
      console.log('Ticket deleted:', ticketId);
    }
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      if (showEditModal && selectedTicket) {
        // Update existing ticket
        setTickets(prev => prev.map(ticket => 
          ticket.id === selectedTicket.id 
            ? { ...ticket, ...formData, updatedAt: new Date().toISOString() }
            : ticket
        ));
        console.log('Ticket updated:', selectedTicket.id);
      } else {
        // Create new ticket
        const newTicket = {
          id: Date.now(),
          ...formData,
          status: TICKET_STATUS.OPEN,
          customerName: formData.customerEmail.split('@')[0],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          tags: [],
          attachments: [],
          comments: [],
          timeSpent: 0,
          satisfaction: null
        };
        setTickets(prev => [newTicket, ...prev]);
        console.log('Ticket created:', newTicket.id);
      }
      
      setLoading(false);
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedTicket(null);
    }, 1000);
  };

  const handleBulkAction = (action) => {
    if (selectedTickets.length === 0) return;
    
    setLoading(true);
    setTimeout(() => {
      switch (action) {
        case 'assign':
          console.log('Bulk assign tickets:', selectedTickets);
          break;
        case 'change_status':
          console.log('Bulk change status:', selectedTickets);
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedTickets.length} tickets?`)) {
            setTickets(prev => prev.filter(ticket => !selectedTickets.includes(ticket.id)));
            console.log('Bulk delete tickets:', selectedTickets);
          }
          break;
        case 'export':
          const dataStr = JSON.stringify(
            tickets.filter(ticket => selectedTickets.includes(ticket.id)), 
            null, 2
          );
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'tickets-export.json';
          link.click();
          URL.revokeObjectURL(url);
          break;
        default:
          break;
      }
      
      setSelectedTickets([]);
      setBulkAction('');
      setShowBulkActions(false);
      setLoading(false);
    }, 1000);
  };

  const handleTicketSelect = (ticketId) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredTickets.map(ticket => ticket.id));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* AI-Powered Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mr-4">
              <Sparkles size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ResolveMeQ AI Assistant
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get instant IT support with our AI-powered assistant. Describe your issue and get step-by-step solutions.
          </p>
        </motion.div>

        {showAIAgent ? (
          /* AI Chat Interface */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="overflow-hidden bg-white/80 backdrop-blur-sm border-0 shadow-2xl">
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 bg-white/20 rounded-lg mr-3">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">AI Support Assistant</h3>
                      <p className="text-blue-100">Ready to help resolve your IT issues</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAIAgent(false)}
                    className="text-white hover:bg-white/20"
                  >
                    ✕
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {aiMessages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-md rounded-2xl p-4 ${
                        message.type === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        <p className="whitespace-pre-line">{message.message}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <button
                                key={idx}
                                onClick={() => setUserMessage(suggestion)}
                                className="block w-full text-left p-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {isAiTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gray-100 rounded-2xl p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Input */}
              <div className="border-t bg-gray-50 p-4">
                <div className="flex space-x-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessageToAI()}
                      placeholder="Describe your IT issue..."
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <PaperClip size={20} />
                    </button>
                  </div>
                  <Button
                    onClick={sendMessageToAI}
                    disabled={!userMessage.trim()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 px-6"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          /* Main Landing Interface */
          <div className="space-y-8">
            
            {/* Quick Action Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {quickActions.map((action) => (
                <Card 
                  key={action.id} 
                  className="group cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-0"
                  onClick={() => startAIAgent(action.label)}
                >
                  <div className="p-6 text-center">
                    <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl inline-block mb-4 group-hover:scale-110 transition-transform">
                      <action.icon size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{action.label}</h3>
                    <p className="text-sm text-gray-600">Get AI-powered help instantly</p>
                  </div>
                </Card>
              ))}
            </motion.div>

            {/* Start AI Chat Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center"
            >
              <Button
                onClick={() => startAIAgent()}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 text-lg font-semibold rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <MessageSquare size={24} className="mr-3" />
                Start AI Assistance
              </Button>
              <p className="text-gray-600 mt-3">Or describe your issue in detail</p>
            </motion.div>

            {/* Recent Activity */}
            {activeTickets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-0">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                      <Clock size={24} className="mr-2 text-blue-600" />
                      Recent Activity
                    </h3>
                    <div className="space-y-3">
                      {activeTickets.map((ticket) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            {ticket.aiSolved ? (
                              <CheckCircle size={20} className="text-green-500 mr-3" />
                            ) : (
                              <AlertTriangle size={20} className="text-amber-500 mr-3" />
                            )}
                            <div>
                              <p className="font-medium text-gray-800">{ticket.title}</p>
                              <p className="text-sm text-gray-600">{ticket.time}</p>
                            </div>
                          </div>
                          <Badge variant={ticket.status === 'resolved' ? 'success' : 'warning'}>
                            {ticket.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tickets;
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value={TICKET_STATUS.OPEN}>Open</option>
                <option value={TICKET_STATUS.IN_PROGRESS}>In Progress</option>
                <option value={TICKET_STATUS.RESOLVED}>Resolved</option>
                <option value={TICKET_STATUS.CLOSED}>Closed</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priority</option>
                <option value={PRIORITY_LEVELS.CRITICAL}>Critical</option>
                <option value={PRIORITY_LEVELS.HIGH}>High</option>
                <option value={PRIORITY_LEVELS.MEDIUM}>Medium</option>
                <option value={PRIORITY_LEVELS.LOW}>Low</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Network">Network</option>
                <option value="Access">Access</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900">
                {selectedTickets.length} ticket(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('assign')}
                >
                  <UserPlus size={14} className="mr-1" />
                  Assign
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('change_status')}
                >
                  <Edit size={14} className="mr-1" />
                  Change Status
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                >
                  <Download size={14} className="mr-1" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTickets([])}
            >
              Clear Selection
            </Button>
          </div>
        </motion.div>
      )}

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredTickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card 
                variant="elevated" 
                className={`p-6 h-full cursor-pointer transition-all ${
                  selectedTickets.includes(ticket.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleTicketSelect(ticket.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {ticket.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {ticket.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <User size={14} className="text-gray-400" />
                      <span className="text-gray-600">{ticket.customerName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} className="text-gray-400" />
                      <span className="text-gray-600">{formatDate(ticket.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Tag size={14} className="text-gray-400" />
                      <span className="text-gray-600">{ticket.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare size={14} className="text-gray-400" />
                      <span className="text-gray-600">{ticket.comments.length} comments</span>
                    </div>
                  </div>

                  {ticket.assignedTo && (
                    <div className="flex items-center space-x-1 text-sm">
                      <User size={14} className="text-gray-400" />
                      <span className="text-gray-600">Assigned to {ticket.assignedTo}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(ticket);
                    }}
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditTicket(ticket);
                      }}
                    >
                      <Edit size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTicket(ticket.id);
                      }}
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
      {filteredTickets.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <Button variant="primary" onClick={handleCreateTicket}>
            <Plus size={16} className="mr-2" />
            Create First Ticket
          </Button>
        </motion.div>
      )}

      {/* Create/Edit Ticket Modal */}
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
                  {showEditModal ? 'Edit Ticket' : 'Create New Ticket'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedTicket(null);
                  }}
                >
                  ×
                </Button>
              </div>

              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter ticket title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the issue in detail"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select category</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Network">Network</option>
                      <option value="Access">Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={PRIORITY_LEVELS.LOW}>Low</option>
                      <option value={PRIORITY_LEVELS.MEDIUM}>Medium</option>
                      <option value={PRIORITY_LEVELS.HIGH}>High</option>
                      <option value={PRIORITY_LEVELS.CRITICAL}>Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Email</label>
                    <input
                      type="email"
                      required
                      value={formData.customerEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="customer@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer Phone</label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assign To</label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Unassigned</option>
                    <option value="Sarah Johnson">Sarah Johnson</option>
                    <option value="Mike Chen">Mike Chen</option>
                    <option value="Emma Davis">Emma Davis</option>
                    <option value="John Smith">John Smith</option>
                    <option value="Lisa Wang">Lisa Wang</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedTicket(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : (showEditModal ? 'Update Ticket' : 'Create Ticket')}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTicket && (
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
              className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Ticket Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailsModal(false)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Ticket Header */}
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTicket.title}</h3>
                  <div className="flex items-center space-x-4">
                    {getStatusBadge(selectedTicket.status)}
                    {getPriorityBadge(selectedTicket.priority)}
                    <span className="text-sm text-gray-600">#{selectedTicket.id}</span>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Ticket Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="mt-1 text-gray-900">{selectedTicket.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Category</label>
                        <p className="mt-1 text-gray-900">{selectedTicket.category}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assigned To</label>
                        <p className="mt-1 text-gray-900">{selectedTicket.assignedTo || 'Unassigned'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Time Spent</label>
                        <p className="mt-1 text-gray-900">{selectedTicket.timeSpent} hours</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Customer Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="mt-1 text-gray-900">{selectedTicket.customerName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="mt-1 text-gray-900">{selectedTicket.customerEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="mt-1 text-gray-900">{selectedTicket.customerPhone}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="mt-1 text-gray-900">{formatDate(selectedTicket.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Comments ({selectedTicket.comments.length})</h4>
                  <div className="space-y-3">
                    {selectedTicket.comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{comment.author}</span>
                          <span className="text-sm text-gray-500">{formatDate(comment.timestamp)}</span>
                        </div>
                        <p className="text-gray-700">{comment.message}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={() => handleEditTicket(selectedTicket)}
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tickets; 