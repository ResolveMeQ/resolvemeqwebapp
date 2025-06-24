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
  Paperclip,
  Smartphone,
  Monitor,
  Wifi,
  Settings
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';

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
                      <Paperclip size={20} />
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
