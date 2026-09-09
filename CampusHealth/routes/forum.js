const express = require('express');
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const ForumPost = require('../models/ForumPost');
const { auth, adminAuth } = require('../middleware/auth');
const requireDatabase = require('../middleware/requireDatabase');
const { notifyUser } = require('../utils/notificationService');

const router = express.Router();
const categories = ['general', 'anxiety', 'depression', 'stress', 'relationships', 'academic', 'coping-tips', 'success-stories', 'questions'];
const privilegedRoles = ['counselor', 'admin'];

router.use(requireDatabase);

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const idValidation = [param('id').isMongoId().withMessage('Invalid post ID')];
const replyIdValidation = [
  ...idValidation,
  param('replyId').isMongoId().withMessage('Invalid reply ID')
];

function publicPost(post, viewer) {
  const data = typeof post.toObject === 'function' ? post.toObject() : { ...post };
  const authorId = data.authorId?._id || data.authorId;
  data.isOwner = Boolean(authorId && String(authorId) === String(viewer._id));
  data.hasLiked = (data.likes || []).some(id => String(id?._id || id) === String(viewer._id));
  data.hasReported = (data.reportedBy || []).some(
    report => String(report.userId?._id || report.userId) === String(viewer._id) && report.status === 'pending'
  );

  if (viewer.role !== 'admin') {
    delete data.reportedBy;
    delete data.moderatorNotes;
    delete data.approvedBy;
    if (data.isAnonymous) data.authorId = null;
  }

  data.comments = (data.comments || []).filter(reply => reply.isApproved !== false).map(reply => {
    const replyData = {
      ...reply,
      isOwner: String(reply.authorId?._id || reply.authorId) === String(viewer._id)
    };
    if (viewer.role !== 'admin' && reply.isAnonymous) replyData.authorId = null;
    return replyData;
  });
  return data;
}

const findVisiblePost = async id => ForumPost.findOne({ _id: id, status: 'active' })
  .populate('authorId', 'name firstName lastName department year role')
  .populate('comments.authorId', 'name firstName lastName department role');

router.get('/categories/list', auth, (req, res) => {
  res.json({
    categories: categories.map(id => ({
      id,
      name: id.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ')
    }))
  });
});

router.get('/posts', auth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('category').optional().isIn(categories),
  query('sort').optional().isIn(['newest', 'popular']),
  validate
], async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const match = { status: 'active' };
    if (req.query.category) match.category = req.query.category;
    if (req.query.search?.trim()) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      match.$or = [
        { title: { $regex: escaped, $options: 'i' } },
        { content: { $regex: escaped, $options: 'i' } }
      ];
    }

    const pipeline = [{ $match: match }];
    if (req.query.sort === 'popular') {
      pipeline.push(
        { $addFields: { popularity: { $add: [{ $size: '$likes' }, { $multiply: [{ $size: '$comments' }, 2] }, '$views'] } } },
        { $sort: { isPinned: -1, popularity: -1, createdAt: -1 } }
      );
    } else {
      pipeline.push({ $sort: { isPinned: -1, createdAt: -1 } });
    }
    pipeline.push({ $skip: (page - 1) * limit }, { $limit: limit });

    let posts = await ForumPost.aggregate(pipeline);
    posts = await ForumPost.populate(posts, [
      { path: 'authorId', select: 'name firstName lastName department year role' },
      { path: 'comments.authorId', select: 'name firstName lastName department role' }
    ]);
    const total = await ForumPost.countDocuments(match);
    res.json({
      posts: posts.map(post => publicPost(post, req.user)),
      pagination: { current: page, pages: Math.ceil(total / limit), total }
    });
  } catch (error) {
    console.error('Get forum posts error:', error);
    res.status(500).json({ message: 'Failed to get forum posts' });
  }
});

router.get('/posts/:id', auth, idValidation, validate, async (req, res) => {
  try {
    const post = await findVisiblePost(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    await ForumPost.updateOne({ _id: post._id }, { $inc: { views: 1 } });
    post.views += 1;
    res.json({ post: publicPost(post, req.user) });
  } catch (error) {
    console.error('Get forum post error:', error);
    res.status(500).json({ message: 'Failed to get forum post' });
  }
});

router.post('/posts', auth, [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3 to 200 characters'),
  body('content').trim().isLength({ min: 3, max: 5000 }).withMessage('Content must be 3 to 5000 characters'),
  body('category').isIn(categories).withMessage('Invalid category'),
  body('isAnonymous').optional().isBoolean(),
  validate
], async (req, res) => {
  try {
    const post = await ForumPost.create({
      authorId: req.user._id,
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      isAnonymous: Boolean(req.body.isAnonymous),
      language: req.body.language || 'en'
    });
    res.status(201).json({ message: 'Post created successfully', post: publicPost(post, req.user) });
  } catch (error) {
    console.error('Create forum post error:', error);
    res.status(500).json({ message: 'Failed to create forum post' });
  }
});

router.put('/posts/:id', auth, [
  ...idValidation,
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('content').optional().trim().isLength({ min: 3, max: 5000 }),
  body('category').optional().isIn(categories),
  body('isAnonymous').optional().isBoolean(),
  validate
], async (req, res) => {
  try {
    const post = await ForumPost.findOne({ _id: req.params.id, authorId: req.user._id, status: 'active' });
    if (!post) return res.status(403).json({ message: 'Only the post owner may edit this post' });
    ['title', 'content', 'category', 'isAnonymous'].forEach(field => {
      if (req.body[field] !== undefined) post[field] = req.body[field];
    });
    await post.save();
    res.json({ message: 'Post updated successfully', post: publicPost(post, req.user) });
  } catch (error) {
    console.error('Update forum post error:', error);
    res.status(500).json({ message: 'Failed to update forum post' });
  }
});

router.delete('/posts/:id', auth, idValidation, validate, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (req.user.role !== 'admin' && String(post.authorId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the post owner or an admin may delete this post' });
    }
    post.status = 'deleted';
    await post.save();
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete forum post error:', error);
    res.status(500).json({ message: 'Failed to delete forum post' });
  }
});

router.post('/posts/:id/like', auth, idValidation, validate, async (req, res) => {
  try {
    const post = await ForumPost.findOneAndUpdate(
      { _id: req.params.id, status: 'active', likes: { $ne: req.user._id } },
      { $addToSet: { likes: req.user._id } },
      { new: true }
    );
    if (!post) {
      const exists = await ForumPost.exists({ _id: req.params.id, status: 'active' });
      return res.status(exists ? 409 : 404).json({ message: exists ? 'You already liked this post' : 'Post not found' });
    }
    if (String(post.authorId) !== String(req.user._id)) {
      await notifyUser({
        userId: post.authorId,
        type: 'forum_post_liked',
        title: 'Someone liked your post',
        message: `Your post “${post.title}” received a new like.`,
        metadata: { postId: post._id }
      });
    }
    res.json({ message: 'Post liked successfully', likeCount: post.likes.length });
  } catch (error) {
    console.error('Like forum post error:', error);
    res.status(500).json({ message: 'Failed to like forum post' });
  }
});

router.delete('/posts/:id/like', auth, idValidation, validate, async (req, res) => {
  try {
    const post = await ForumPost.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { $pull: { likes: req.user._id } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json({ message: 'Post unliked successfully', likeCount: post.likes.length });
  } catch (error) {
    console.error('Unlike forum post error:', error);
    res.status(500).json({ message: 'Failed to unlike forum post' });
  }
});

router.post('/posts/:id/comments', auth, [
  ...idValidation,
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Reply must be 1 to 1000 characters'),
  body('isAnonymous').optional().isBoolean(),
  validate
], async (req, res) => {
  try {
    const post = await ForumPost.findOne({ _id: req.params.id, status: 'active' });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (post.isLocked) return res.status(400).json({ message: 'This post is locked' });
    post.comments.push({
      authorId: req.user._id,
      content: req.body.content,
      isAnonymous: Boolean(req.body.isAnonymous)
    });
    post.lastActivity = new Date();
    await post.save();
    if (String(post.authorId) !== String(req.user._id)) {
      await notifyUser({
        userId: post.authorId,
        type: 'forum_reply_received',
        title: 'New reply to your post',
        message: `Someone replied to “${post.title}”.`,
        metadata: { postId: post._id, replyId: post.comments[post.comments.length - 1]._id }
      });
    }
    res.status(201).json({ message: 'Reply added successfully', reply: post.comments[post.comments.length - 1] });
  } catch (error) {
    console.error('Add reply error:', error);
    res.status(500).json({ message: 'Failed to add reply' });
  }
});

router.delete('/posts/:id/comments/:replyId', auth, replyIdValidation, validate, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const reply = post.comments.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    const ownsReply = String(reply.authorId) === String(req.user._id);
    if (req.user.role !== 'admin' && !ownsReply) {
      return res.status(403).json({ message: 'Only the reply owner or an admin may remove this reply' });
    }
    post.comments.pull(reply._id);
    await post.save();
    res.json({ message: 'Reply removed successfully' });
  } catch (error) {
    console.error('Remove reply error:', error);
    res.status(500).json({ message: 'Failed to remove reply' });
  }
});

router.patch('/posts/:id/comments/:replyId/pin', auth, replyIdValidation, validate, async (req, res) => {
  try {
    if (!privilegedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Counselor or admin access required' });
    }
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const reply = post.comments.id(req.params.replyId);
    if (!reply) return res.status(404).json({ message: 'Reply not found' });
    reply.isPinned = !reply.isPinned;
    reply.pinnedBy = reply.isPinned ? req.user._id : undefined;
    await post.save();
    res.json({ message: reply.isPinned ? 'Reply pinned successfully' : 'Reply unpinned successfully', isPinned: reply.isPinned });
  } catch (error) {
    console.error('Pin reply error:', error);
    res.status(500).json({ message: 'Failed to update reply pin' });
  }
});

router.post('/posts/:id/report', auth, [
  ...idValidation,
  body('reason').trim().isLength({ min: 3, max: 500 }).withMessage('Report reason must be 3 to 500 characters'),
  validate
], async (req, res) => {
  try {
    const post = await ForumPost.findOne({ _id: req.params.id, status: 'active' });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    await post.reportPost(req.user._id, req.body.reason);
    res.json({ message: 'Post reported successfully' });
  } catch (error) {
    if (error.code === 'DUPLICATE_REPORT') return res.status(409).json({ message: error.message });
    console.error('Report forum post error:', error);
    res.status(500).json({ message: 'Failed to report post' });
  }
});

router.get('/moderation/reports', adminAuth, async (req, res) => {
  try {
    const posts = await ForumPost.find({ 'reportedBy.status': 'pending', status: { $ne: 'deleted' } })
      .populate('authorId', 'name firstName lastName email')
      .populate('reportedBy.userId', 'name firstName lastName email')
      .sort({ createdAt: -1 });
    res.json({ posts });
  } catch (error) {
    console.error('Get forum reports error:', error);
    res.status(500).json({ message: 'Failed to get forum reports' });
  }
});

router.patch('/posts/:id/reports/moderate', adminAuth, [
  ...idValidation,
  body('action').isIn(['dismiss', 'remove']).withMessage('Invalid moderation action'),
  validate
], async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const reportStatus = req.body.action === 'remove' ? 'actioned' : 'dismissed';
    post.reportedBy.forEach(report => {
      if (report.status === 'pending') {
        report.status = reportStatus;
        report.resolvedBy = req.user._id;
        report.resolvedAt = new Date();
      }
    });
    if (req.body.action === 'remove') post.status = 'deleted';
    await post.save();
    await notifyUser({
      userId: post.authorId,
      type: 'forum_post_moderated',
      title: 'Forum post reviewed',
      message: req.body.action === 'remove'
        ? `Your post “${post.title}” was removed by a moderator.`
        : `Reports concerning your post “${post.title}” were reviewed and dismissed.`,
      metadata: { postId: post._id, action: req.body.action }
    });
    res.json({ message: req.body.action === 'remove' ? 'Reported post removed' : 'Reports dismissed' });
  } catch (error) {
    console.error('Moderate forum reports error:', error);
    res.status(500).json({ message: 'Failed to moderate reports' });
  }
});

router.patch('/posts/:id/pin', adminAuth, idValidation, validate, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    post.isPinned = !post.isPinned;
    await post.save();
    res.json({ message: post.isPinned ? 'Announcement pinned' : 'Announcement unpinned', isPinned: post.isPinned });
  } catch (error) {
    console.error('Pin forum post error:', error);
    res.status(500).json({ message: 'Failed to update announcement pin' });
  }
});

module.exports = router;
