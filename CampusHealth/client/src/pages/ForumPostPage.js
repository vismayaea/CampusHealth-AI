import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle, ArrowLeft, Flag, Heart, Loader2, MessageCircle,
  Pin, RefreshCw, Send, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { forumAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const displayName = person => person?.name
  || `${person?.firstName || 'User'} ${person?.lastName || ''}`.trim();
const errorMessage = error => error.response?.data?.message || 'Unable to complete this action.';

function ForumPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [reply, setReply] = useState('');
  const [anonymousReply, setAnonymousReply] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const loadPost = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setNotFound(false);
      const response = await forumAPI.getPost(id);
      setPost(response.data.post);
    } catch (requestError) {
      setPost(null);
      if ([400, 404].includes(requestError.response?.status)) setNotFound(true);
      else setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPost(); }, [loadPost]);

  const pendingReports = useMemo(
    () => (post?.reportedBy || []).filter(report => report.status === 'pending').length,
    [post]
  );

  const runAction = async (operation, successMessage, { reload = true, redirect = false } = {}) => {
    try {
      setActionPending(true);
      await operation();
      toast.success(successMessage);
      if (redirect) navigate('/app/forum');
      else if (reload) await loadPost();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setActionPending(false);
    }
  };

  const submitReply = async event => {
    event.preventDefault();
    if (!reply.trim()) return;
    try {
      setSubmittingReply(true);
      await forumAPI.addComment(id, { content: reply.trim(), isAnonymous: anonymousReply });
      setReply('');
      setAnonymousReply(false);
      toast.success('Reply posted');
      await loadPost();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setSubmittingReply(false);
    }
  };

  const reportPost = () => {
    const reason = window.prompt('Please explain why this post should be reviewed:');
    if (reason?.trim()) {
      runAction(() => forumAPI.reportPost(id, reason.trim()), 'Report submitted for review');
    }
  };

  if (loading) {
    return (
      <div className="card py-16 flex justify-center text-neutral-500">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading post...
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="card py-16 text-center">
        <AlertCircle className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-neutral-900">Post not found</h1>
        <p className="text-neutral-600 mt-2 mb-6">This post may have been removed or the link may be invalid.</p>
        <button className="btn-primary" onClick={() => navigate('/app/forum')}>Return to forum</button>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="card py-16 text-center">
        <AlertCircle className="h-12 w-12 text-danger-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-neutral-900">Unable to load post</h1>
        <p className="text-neutral-600 mt-2 mb-6">{error}</p>
        <button className="btn-primary inline-flex items-center" onClick={loadPost}>
          <RefreshCw className="h-4 w-4 mr-2" /> Try again
        </button>
      </div>
    );
  }

  const hidePostAuthor = post.isAnonymous && user?.role !== 'admin';
  const authorName = hidePostAuthor ? 'Anonymous' : displayName(post.authorId);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <button aria-label="Back to forum" onClick={() => navigate('/app/forum')} className="p-2 rounded-lg hover:bg-neutral-100">
          <ArrowLeft className="h-5 w-5 text-neutral-600" />
        </button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-neutral-900 break-words">{post.title}</h1>
          <p className="text-neutral-600">
            Posted by {authorName} · {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <article className="card">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-medium text-primary-600">{hidePostAuthor ? 'A' : authorName.charAt(0)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium text-neutral-900">{authorName}</h2>
                  <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-full capitalize">
                    {post.category?.replace('-', ' ')}
                  </span>
                  {post.isPinned && <span className="inline-flex items-center text-xs text-primary-700"><Pin className="h-3 w-3 mr-1" />Pinned</span>}
                </div>
                {!hidePostAuthor && post.authorId && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {[post.authorId.department, post.authorId.year].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
            </div>

            <p className="text-neutral-700 whitespace-pre-wrap break-words mt-6">{post.content}</p>

            <div className="flex flex-wrap items-center gap-5 mt-6 pt-4 border-t border-neutral-200 text-sm">
              <button
                disabled={actionPending}
                onClick={() => runAction(
                  () => post.hasLiked ? forumAPI.unlikePost(id) : forumAPI.likePost(id),
                  post.hasLiked ? 'Like removed' : 'Post liked'
                )}
                className={`inline-flex items-center ${post.hasLiked ? 'text-danger-600' : 'text-neutral-600 hover:text-danger-600'}`}
              >
                <Heart className={`h-5 w-5 mr-1 ${post.hasLiked ? 'fill-current' : ''}`} /> {post.likes?.length || 0}
              </button>
              <span className="inline-flex items-center text-neutral-600">
                <MessageCircle className="h-5 w-5 mr-1" /> {post.comments?.length || 0} replies
              </span>
              <button disabled={post.hasReported || actionPending} onClick={reportPost} className="inline-flex items-center text-neutral-600 hover:text-warning-600 disabled:opacity-50">
                <Flag className="h-5 w-5 mr-1" /> {post.hasReported ? 'Reported' : 'Report'}
              </button>
              {(post.isOwner || user?.role === 'admin') && (
                <button
                  disabled={actionPending}
                  onClick={() => window.confirm('Delete this post?') && runAction(
                    () => forumAPI.deletePost(id), 'Post deleted', { redirect: true }
                  )}
                  className="inline-flex items-center text-danger-600 ml-auto"
                >
                  <Trash2 className="h-5 w-5 mr-1" /> Delete
                </button>
              )}
            </div>
          </article>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">Replies ({post.comments?.length || 0})</h2>
            {!post.comments?.length ? (
              <div className="card py-10 text-center text-neutral-500">Supportive replies from students, counselors, or moderators will appear here.</div>
            ) : (
              <div className="space-y-4">
                {[...post.comments].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).map(item => {
                  const hideReplyAuthor = item.isAnonymous && user?.role !== 'admin';
                  const replyAuthor = hideReplyAuthor ? 'Anonymous' : displayName(item.authorId);
                  return (
                    <div key={item._id} className={`card ${item.isPinned ? 'border-primary-200 bg-primary-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-neutral-600">{hideReplyAuthor ? 'A' : replyAuthor.charAt(0)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <strong className="text-neutral-900">{replyAuthor}</strong>
                            <span className="text-xs text-neutral-500">{new Date(item.createdAt).toLocaleString()}</span>
                            {item.isPinned && <span className="text-xs text-primary-700">Helpful response</span>}
                            <div className="ml-auto flex gap-3 text-xs">
                              {['counselor', 'admin'].includes(user?.role) && (
                                <button
                                  onClick={() => runAction(
                                    () => forumAPI.pinComment(id, item._id),
                                    item.isPinned ? 'Reply unpinned' : 'Helpful reply pinned'
                                  )}
                                  className="text-primary-600"
                                >
                                  {item.isPinned ? 'Unpin' : 'Pin'}
                                </button>
                              )}
                              {(item.isOwner || user?.role === 'admin') && (
                                <button
                                  onClick={() => window.confirm('Delete this reply?') && runAction(
                                    () => forumAPI.removeComment(id, item._id), 'Reply deleted'
                                  )}
                                  className="text-danger-600"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-neutral-700 mt-2 whitespace-pre-wrap break-words">{item.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <form onSubmit={submitReply} className="card">
            <h2 className="font-medium text-neutral-900 mb-3">Add a Reply</h2>
            <textarea
              required maxLength={1000}
              value={reply}
              onChange={event => setReply(event.target.value)}
              placeholder="Share a supportive response..."
              className="form-textarea form-input w-full h-28 mb-3"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" checked={anonymousReply} onChange={event => setAnonymousReply(event.target.checked)} />
                Reply anonymously
              </label>
              <button disabled={submittingReply || !reply.trim()} className="btn-primary inline-flex items-center justify-center disabled:opacity-50">
                {submittingReply ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Post Reply
              </button>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="card">
            <h2 className="font-semibold text-neutral-900 mb-4">Post details</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-neutral-500">Views</dt><dd className="font-medium">{post.views || 0}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Likes</dt><dd className="font-medium">{post.likes?.length || 0}</dd></div>
              <div className="flex justify-between"><dt className="text-neutral-500">Replies</dt><dd className="font-medium">{post.comments?.length || 0}</dd></div>
            </dl>
          </div>

          {user?.role === 'admin' && (
            <div className="card">
              <h2 className="font-semibold text-neutral-900 mb-4">Moderation</h2>
              <div className="space-y-3">
                <button
                  disabled={actionPending}
                  onClick={() => runAction(() => forumAPI.pinPost(id), post.isPinned ? 'Post unpinned' : 'Post pinned')}
                  className="btn-outline w-full inline-flex items-center justify-center"
                >
                  <Pin className="h-4 w-4 mr-2" /> {post.isPinned ? 'Unpin announcement' : 'Pin announcement'}
                </button>
                {pendingReports > 0 && (
                  <>
                    <p className="text-sm text-warning-700">{pendingReports} pending report{pendingReports === 1 ? '' : 's'}</p>
                    <button
                      disabled={actionPending}
                      onClick={() => runAction(() => forumAPI.moderateReports(id, 'dismiss'), 'Reports dismissed')}
                      className="btn-outline w-full"
                    >
                      Dismiss reports
                    </button>
                    <button
                      disabled={actionPending}
                      onClick={() => window.confirm('Remove this reported post?') && runAction(
                        () => forumAPI.moderateReports(id, 'remove'), 'Post removed', { redirect: true }
                      )}
                      className="btn-danger w-full"
                    >
                      Remove reported post
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ForumPostPage;
