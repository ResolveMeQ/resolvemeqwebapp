/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} name - User's full name
 * @property {string} email - User's email address
 * @property {string} avatar - URL to user's avatar image
 * @property {string} role - User role (admin, agent, user)
 * @property {string} department - User's department
 * @property {Date} createdAt - Account creation date
 * @property {Date} lastLogin - Last login timestamp
 * @property {boolean} isActive - Whether the user account is active
 */

/**
 * @typedef {Object} Ticket
 * @property {string} id - Unique ticket identifier
 * @property {string} title - Ticket title/summary
 * @property {string} description - Detailed ticket description
 * @property {string} status - Current ticket status
 * @property {string} priority - Ticket priority level
 * @property {string} category - Ticket category
 * @property {string} assignedTo - ID of assigned agent
 * @property {string} createdBy - ID of ticket creator
 * @property {Date} createdAt - Ticket creation date
 * @property {Date} updatedAt - Last update timestamp
 * @property {Date} resolvedAt - Resolution timestamp
 * @property {Array<Comment>} comments - Ticket comments
 * @property {Array<Attachment>} attachments - Ticket attachments
 * @property {Object} metadata - Additional ticket metadata
 */

/**
 * @typedef {Object} Comment
 * @property {string} id - Unique comment identifier
 * @property {string} content - Comment text content
 * @property {string} authorId - ID of comment author
 * @property {Date} createdAt - Comment creation timestamp
 * @property {boolean} isInternal - Whether comment is internal (agent-only)
 */

/**
 * @typedef {Object} Attachment
 * @property {string} id - Unique attachment identifier
 * @property {string} filename - Original filename
 * @property {string} url - File download URL
 * @property {string} mimeType - File MIME type
 * @property {number} size - File size in bytes
 * @property {string} uploadedBy - ID of user who uploaded the file
 * @property {Date} uploadedAt - Upload timestamp
 */

/**
 * @typedef {Object} Analytics
 * @property {Object} tickets - Ticket-related analytics
 * @property {number} tickets.total - Total number of tickets
 * @property {number} tickets.open - Number of open tickets
 * @property {number} tickets.resolved - Number of resolved tickets
 * @property {number} tickets.critical - Number of critical tickets
 * @property {Object} performance - Performance metrics
 * @property {number} performance.avgResolutionTime - Average resolution time in hours
 * @property {number} performance.firstResponseTime - Average first response time in hours
 * @property {number} performance.satisfactionScore - Customer satisfaction score (1-5)
 * @property {Object} trends - Trend data
 * @property {Array<Object>} trends.byStatus - Tickets by status over time
 * @property {Array<Object>} trends.byCategory - Tickets by category over time
 * @property {Array<Object>} trends.byPriority - Tickets by priority over time
 */

/**
 * @typedef {Object} Notification
 * @property {string} id - Unique notification identifier
 * @property {string} type - Notification type (info, success, warning, error)
 * @property {string} title - Notification title
 * @property {string} message - Notification message
 * @property {string} userId - ID of user to notify
 * @property {boolean} isRead - Whether notification has been read
 * @property {Date} createdAt - Notification creation timestamp
 * @property {Object} metadata - Additional notification data
 */

/**
 * @typedef {Object} DashboardMetrics
 * @property {number} totalTickets - Total number of tickets
 * @property {number} openTickets - Number of open tickets
 * @property {number} resolvedToday - Number of tickets resolved today
 * @property {number} avgResolutionTime - Average resolution time in hours
 * @property {number} satisfactionScore - Customer satisfaction score
 * @property {Array<Object>} recentActivity - Recent ticket activity
 * @property {Array<Object>} topCategories - Most common ticket categories
 * @property {Array<Object>} agentPerformance - Agent performance metrics
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} theme - User's preferred theme (light, dark, auto)
 * @property {string} language - User's preferred language
 * @property {boolean} emailNotifications - Whether to receive email notifications
 * @property {boolean} pushNotifications - Whether to receive push notifications
 * @property {Object} dashboard - Dashboard preferences
 * @property {Array<string>} dashboard.widgets - Enabled dashboard widgets
 * @property {Object} dashboard.layout - Dashboard layout configuration
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the API call was successful
 * @property {any} data - Response data
 * @property {string} message - Response message
 * @property {Array<string>} errors - Array of error messages
 * @property {number} statusCode - HTTP status code
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} page - Current page number
 * @property {number} limit - Number of items per page
 * @property {string} sortBy - Field to sort by
 * @property {string} sortOrder - Sort order (asc, desc)
 * @property {Object} filters - Filter criteria
 */

/**
 * @typedef {Object} SearchParams
 * @property {string} query - Search query string
 * @property {Array<string>} fields - Fields to search in
 * @property {Object} filters - Additional filters
 * @property {PaginationParams} pagination - Pagination parameters
 */

// Export types for use in components
export const TYPES = {
  User: 'User',
  Ticket: 'Ticket',
  Comment: 'Comment',
  Attachment: 'Attachment',
  Analytics: 'Analytics',
  Notification: 'Notification',
  DashboardMetrics: 'DashboardMetrics',
  UserPreferences: 'UserPreferences',
  ApiResponse: 'ApiResponse',
  PaginationParams: 'PaginationParams',
  SearchParams: 'SearchParams',
}; 