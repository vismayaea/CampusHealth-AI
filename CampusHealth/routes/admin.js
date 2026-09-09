const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const ChatSession = require('../models/ChatSession');
const Screening = require('../models/Screening');
const Appointment = require('../models/Appointment');
const Resource = require('../models/Resource');
const ForumPost = require('../models/ForumPost');
const { adminAuth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');
const moment = require('moment');

const router = express.Router();
router.use(requireDatabase);
const appointmentStatuses = ['Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed'];

const getTodayRange = () => ({
  start: moment().startOf('day').toDate(),
  end: moment().endOf('day').toDate()
});

const emptyAppointmentStatusCounts = () => appointmentStatuses.reduce((counts, status) => {
  counts[status] = 0;
  return counts;
}, {});

const normalizeAppointmentStatusStats = (stats = []) => {
  const counts = emptyAppointmentStatusCounts();
  stats.forEach((item) => {
    if (appointmentStatuses.includes(item._id)) {
      counts[item._id] = item.count;
    }
  });
  return counts;
};

const getAppointmentMetrics = async (baseMatch = {}) => {
  const { start: todayStart, end: todayEnd } = getTodayRange();
  const activeUpcomingStatuses = ['Pending', 'Approved'];

  const [
    totalAppointments,
    statusStats,
    todaysAppointments,
    upcomingAppointments
  ] = await Promise.all([
    Appointment.countDocuments(baseMatch),
    Appointment.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Appointment.countDocuments({
      ...baseMatch,
      date: { $gte: todayStart, $lte: todayEnd }
    }),
    Appointment.countDocuments({
      ...baseMatch,
      date: { $gt: todayEnd },
      status: { $in: activeUpcomingStatuses }
    })
  ]);

  const statusCounts = normalizeAppointmentStatusStats(statusStats);

  return {
    total: totalAppointments,
    totalAppointments,
    pending: statusCounts.Pending,
    approved: statusCounts.Approved,
    rejected: statusCounts.Rejected,
    cancelled: statusCounts.Cancelled,
    completed: statusCounts.Completed,
    pendingAppointments: statusCounts.Pending,
    approvedAppointments: statusCounts.Approved,
    rejectedAppointments: statusCounts.Rejected,
    cancelledAppointments: statusCounts.Cancelled,
    completedAppointments: statusCounts.Completed,
    todaysAppointments,
    upcoming: upcomingAppointments,
    upcomingAppointments,
    byStatus: appointmentStatuses.map((status) => ({
      _id: status,
      count: statusCounts[status]
    })),
    statusBreakdown: statusCounts
  };
};

// Get dashboard overview
router.get('/dashboard/overview', adminAuth, async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    let dateFilter;
    switch (timeframe) {
      case 'day':
        dateFilter = moment().subtract(1, 'day');
        break;
      case 'week':
        dateFilter = moment().subtract(1, 'week');
        break;
      case 'month':
        dateFilter = moment().subtract(1, 'month');
        break;
      case 'year':
        dateFilter = moment().subtract(1, 'year');
        break;
      default:
        dateFilter = moment().subtract(1, 'month');
    }

    const totalUsers = await User.countDocuments({ isActive: true });
    const newUsers = await User.countDocuments({
      isActive: true,
      createdAt: { $gte: dateFilter.toDate() }
    });
    const userRoleStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const totalChatSessions = await ChatSession.countDocuments();
    const activeChatSessions = await ChatSession.countDocuments({ status: 'active' });
    const escalatedSessions = await ChatSession.countDocuments({
      escalationLevel: { $in: ['urgent', 'emergency'] }
    });

    const totalScreenings = await Screening.countDocuments();
    const recentScreenings = await Screening.countDocuments({
      createdAt: { $gte: dateFilter.toDate() }
    });
    const screeningSeverityStats = await Screening.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const appointmentMetrics = await getAppointmentMetrics();

    const totalResources = await Resource.countDocuments({ isActive: true });
    const resourceViews = await Resource.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    const totalForumPosts = await ForumPost.countDocuments({ status: 'active' });
    const forumEngagement = await ForumPost.aggregate([
      { $match: { status: 'active' } },
      { $group: { 
        _id: null, 
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: { $size: '$likes' } },
        totalComments: { $sum: { $size: '$comments' } }
      }}
    ]);

    res.json({
      users: {
        total: totalUsers,
        new: newUsers,
        byRole: userRoleStats
      },
      chatSessions: {
        total: totalChatSessions,
        active: activeChatSessions,
        escalated: escalatedSessions
      },
      screenings: {
        total: totalScreenings,
        recent: recentScreenings,
        bySeverity: screeningSeverityStats
      },
      appointments: appointmentMetrics,
      resources: {
        total: totalResources,
        totalViews: resourceViews[0]?.total || 0
      },
      forum: {
        totalPosts: totalForumPosts,
        engagement: forumEngagement[0] || { totalViews: 0, totalLikes: 0, totalComments: 0 }
      },
      timeframe
    });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ message: 'Failed to get dashboard overview' });
  }
});

// Get user analytics
router.get('/analytics/users', adminAuth, async (req, res) => {
  try {
    const { timeframe = 'month', groupBy = 'day' } = req.query;

    let dateFilter;
    switch (timeframe) {
      case 'day':
        dateFilter = moment().subtract(1, 'day');
        break;
      case 'week':
        dateFilter = moment().subtract(1, 'week');
        break;
      case 'month':
        dateFilter = moment().subtract(1, 'month');
        break;
      case 'year':
        dateFilter = moment().subtract(1, 'year');
        break;
      default:
        dateFilter = moment().subtract(1, 'month');
    }

    // User registration trends
    let groupFormat;
    switch (groupBy) {
      case 'hour':
        groupFormat = '%Y-%m-%d %H:00:00';
        break;
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-%U';
        break;
      case 'month':
        groupFormat = '%Y-%m';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const registrationTrends = await User.aggregate([
      { $match: { createdAt: { $gte: dateFilter.toDate() } } },
      { $group: { 
        _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
        count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // User demographics
    const departmentStats = await User.aggregate([
      { $match: { isActive: true, role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const yearOfStudyStats = await User.aggregate([
      { $match: { isActive: true, role: 'student' } },
      { $group: { _id: '$yearOfStudy', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const languageStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$preferredLanguage', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // User activity
    const activeUsers = await User.countDocuments({
      isActive: true,
      lastLogin: { $gte: dateFilter.toDate() }
    });

    res.json({
      registrationTrends,
      demographics: {
        byDepartment: departmentStats,
        byYearOfStudy: yearOfStudyStats,
        byLanguage: languageStats
      },
      activity: {
        activeUsers,
        totalUsers: await User.countDocuments({ isActive: true })
      },
      timeframe,
      groupBy
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ message: 'Failed to get user analytics' });
  }
});

// Get mental health analytics
router.get('/analytics/mental-health', adminAuth, async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    let dateFilter;
    switch (timeframe) {
      case 'day':
        dateFilter = moment().subtract(1, 'day');
        break;
      case 'week':
        dateFilter = moment().subtract(1, 'week');
        break;
      case 'month':
        dateFilter = moment().subtract(1, 'month');
        break;
      case 'year':
        dateFilter = moment().subtract(1, 'year');
        break;
      default:
        dateFilter = moment().subtract(1, 'month');
    }

    // Screening trends
    const screeningTrends = await Screening.aggregate([
      { $match: { createdAt: { $gte: dateFilter.toDate() } } },
      { $group: { 
        _id: { 
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          type: '$type'
        },
        count: { $sum: 1 },
        avgScore: { $avg: '$totalScore' }
      }},
      { $sort: { '_id.date': 1 } }
    ]);

    // Severity distribution
    const severityDistribution = await Screening.aggregate([
      { $match: { createdAt: { $gte: dateFilter.toDate() } } },
      { $group: { 
        _id: { type: '$type', severity: '$severity' },
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);

    // Risk indicators
    const highRiskScreenings = await Screening.countDocuments({
      severity: { $in: ['moderately-severe', 'severe'] },
      createdAt: { $gte: dateFilter.toDate() }
    });

    const emergencyEscalations = await ChatSession.countDocuments({
      escalationLevel: 'emergency',
      createdAt: { $gte: dateFilter.toDate() }
    });

    // Follow-up requirements
    const followUpRequired = await Screening.countDocuments({
      followUpRequired: true,
      createdAt: { $gte: dateFilter.toDate() }
    });

    res.json({
      screeningTrends,
      severityDistribution,
      riskIndicators: {
        highRiskScreenings,
        emergencyEscalations,
        followUpRequired
      },
      timeframe
    });
  } catch (error) {
    console.error('Get mental health analytics error:', error);
    res.status(500).json({ message: 'Failed to get mental health analytics' });
  }
});

// Get engagement analytics
router.get('/analytics/engagement', adminAuth, async (req, res) => {
  try {
    const { timeframe = 'month' } = req.query;

    let dateFilter;
    switch (timeframe) {
      case 'day':
        dateFilter = moment().subtract(1, 'day');
        break;
      case 'week':
        dateFilter = moment().subtract(1, 'week');
        break;
      case 'month':
        dateFilter = moment().subtract(1, 'month');
        break;
      case 'year':
        dateFilter = moment().subtract(1, 'year');
        break;
      default:
        dateFilter = moment().subtract(1, 'month');
    }

    // Chat session engagement
    const chatEngagement = await ChatSession.aggregate([
      { $match: { createdAt: { $gte: dateFilter.toDate() } } },
      { $group: { 
        _id: null,
        totalSessions: { $sum: 1 },
        avgDuration: { $avg: { $subtract: ['$endedAt', '$startedAt'] } },
        avgMessages: { $avg: { $size: '$messages' } },
        escalatedSessions: { 
          $sum: { 
            $cond: [{ $ne: ['$escalationLevel', 'none'] }, 1, 0] 
          } 
        }
      }}
    ]);

    // Resource engagement
    const resourceEngagement = await Resource.aggregate([
      { $match: { isActive: true, createdAt: { $gte: dateFilter.toDate() } } },
      { $group: { 
        _id: null,
        totalViews: { $sum: '$viewCount' },
        totalLikes: { $sum: '$likeCount' },
        totalShares: { $sum: '$shareCount' },
        avgRating: { $avg: '$rating.average' }
      }}
    ]);

    // Forum engagement
    const forumEngagement = await ForumPost.aggregate([
      { $match: { status: 'active', createdAt: { $gte: dateFilter.toDate() } } },
      { $group: { 
        _id: null,
        totalPosts: { $sum: 1 },
        totalViews: { $sum: '$views' },
        totalLikes: { $sum: { $size: '$likes' } },
        totalComments: { $sum: { $size: '$comments' } }
      }}
    ]);

    // Appointment engagement
    const appointmentEngagement = await getAppointmentMetrics({
      createdAt: { $gte: dateFilter.toDate() }
    });

    res.json({
      chat: chatEngagement[0] || {},
      resources: resourceEngagement[0] || {},
      forum: forumEngagement[0] || {},
      appointments: appointmentEngagement,
      timeframe
    });
  } catch (error) {
    console.error('Get engagement analytics error:', error);
    res.status(500).json({ message: 'Failed to get engagement analytics' });
  }
});

// Get system health metrics
router.get('/analytics/system-health', adminAuth, async (req, res) => {
  try {
    // Database connection status
    const dbStatus = 'connected'; // In a real app, check actual DB connection

    // Recent errors (this would come from a logging system)
    const recentErrors = 0; // Placeholder

    // Performance metrics
    const avgResponseTime = 150; // Placeholder - would come from monitoring

    // Storage usage
    const storageUsage = {
      database: '2.5 GB',
      files: '500 MB',
      total: '3.0 GB'
    };

    // Active sessions
    const activeSessions = await ChatSession.countDocuments({ status: 'active' });

    // System load
    const systemLoad = {
      cpu: '45%',
      memory: '60%',
      disk: '70%'
    };

    res.json({
      database: dbStatus,
      recentErrors,
      performance: {
        avgResponseTime: `${avgResponseTime}ms`
      },
      storage: storageUsage,
      activeSessions,
      systemLoad
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ message: 'Failed to get system health metrics' });
  }
});

// Get reports
router.get('/reports/generate', adminAuth, async (req, res) => {
  try {
    const { type, startDate, endDate, format = 'json' } = req.query;

    if (!type || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Report type, start date, and end date are required' 
      });
    }

    const start = moment(startDate).startOf('day');
    const end = moment(endDate).endOf('day');

    let reportData = {};

    switch (type) {
      case 'user-activity':
        reportData = await generateUserActivityReport(start, end);
        break;
      case 'mental-health-trends':
        reportData = await generateMentalHealthTrendsReport(start, end);
        break;
      case 'resource-usage':
        reportData = await generateResourceUsageReport(start, end);
        break;
      case 'appointment-summary':
        reportData = await generateAppointmentSummaryReport(start, end);
        break;
      default:
        return res.status(400).json({ message: 'Invalid report type' });
    }

    res.json({
      reportType: type,
      startDate: start.toDate(),
      endDate: end.toDate(),
      generatedAt: new Date(),
      data: reportData
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

// Helper functions for reports
async function generateUserActivityReport(startDate, endDate) {
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

  const activeUsers = await User.countDocuments({
    lastLogin: { $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

  const userEngagement = await ChatSession.aggregate([
    { $match: { createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() } } },
    { $group: { 
      _id: '$userId',
      sessionCount: { $sum: 1 },
      totalMessages: { $sum: { $size: '$messages' } }
    }},
    { $group: { 
      _id: null,
      avgSessionsPerUser: { $avg: '$sessionCount' },
      avgMessagesPerUser: { $avg: '$totalMessages' }
    }}
  ]);

  return {
    newUsers,
    activeUsers,
    engagement: userEngagement[0] || {}
  };
}

async function generateMentalHealthTrendsReport(startDate, endDate) {
  const screenings = await Screening.find({
    createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

  const severityBreakdown = screenings.reduce((acc, screening) => {
    acc[screening.severity] = (acc[screening.severity] || 0) + 1;
    return acc;
  }, {});

  const typeBreakdown = screenings.reduce((acc, screening) => {
    acc[screening.type] = (acc[screening.type] || 0) + 1;
    return acc;
  }, {});

  return {
    totalScreenings: screenings.length,
    severityBreakdown,
    typeBreakdown,
    avgScore: screenings.reduce((sum, s) => sum + s.totalScore, 0) / screenings.length || 0
  };
}

async function generateResourceUsageReport(startDate, endDate) {
  const resources = await Resource.find({
    isActive: true,
    createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

  const categoryBreakdown = resources.reduce((acc, resource) => {
    acc[resource.category] = (acc[resource.category] || 0) + 1;
    return acc;
  }, {});

  const totalViews = resources.reduce((sum, resource) => sum + resource.viewCount, 0);
  const totalLikes = resources.reduce((sum, resource) => sum + resource.likeCount, 0);

  return {
    totalResources: resources.length,
    categoryBreakdown,
    totalViews,
    totalLikes,
    avgRating: resources.reduce((sum, r) => sum + r.rating.average, 0) / resources.length || 0
  };
}

async function generateAppointmentSummaryReport(startDate, endDate) {
  const appointments = await Appointment.find({
    date: { $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

  const statusBreakdown = appointments.reduce((acc, appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, emptyAppointmentStatusCounts());

  const todayStart = moment().startOf('day').toDate();
  const todayEnd = moment().endOf('day').toDate();
  const todaysAppointments = appointments.filter((appointment) => (
    appointment.date >= todayStart && appointment.date <= todayEnd
  )).length;
  const upcomingAppointments = appointments.filter((appointment) => (
    appointment.date > todayEnd && ['Pending', 'Approved'].includes(appointment.status)
  )).length;

  return {
    totalAppointments: appointments.length,
    pendingAppointments: statusBreakdown.Pending,
    approvedAppointments: statusBreakdown.Approved,
    rejectedAppointments: statusBreakdown.Rejected,
    cancelledAppointments: statusBreakdown.Cancelled,
    completedAppointments: statusBreakdown.Completed,
    todaysAppointments,
    upcomingAppointments,
    statusBreakdown,
    completionRate: (statusBreakdown.Completed || 0) / appointments.length * 100 || 0
  };
}

// User Management Endpoints
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { role, status, search, department, page = 1, limit = 50 } = req.query;
    let query = {};
    if (role) query.role = role;
    if (status) query.isActive = status === 'active';
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }
    const users = await User.find(query)
      .select('-password -mentalHealthHistory')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await User.countDocuments(query);
    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = isActive;
    await user.save();
    res.json({ message: 'User status updated', user: { id: user._id, isActive: user.isActive } });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

module.exports = router;
