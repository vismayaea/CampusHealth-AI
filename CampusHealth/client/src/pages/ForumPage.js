import React, { useCallback, useEffect, useState } from 'react';
import {
  Users, Plus, MessageCircle, Heart, X, Trash2, Send, Search,
  Flag, Pencil, Pin, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { forumAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const emptyForm = { title: '', content: '', category: 'general', isAnonymous: false };
const displayName = person => person?.name || `${person?.firstName || 'User'} ${person?.lastName || ''}`.trim();
const errorMessage = error => error.response?.data?.message || 'Something went wrong. Please try again.';

function ForumPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replying, setReplying] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await forumAPI.getPosts({ category: category || undefined, search: search || undefined, sort, limit: 50 });
      setPosts(response.data.posts || []);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [category, search, sort]);

  useEffect(() => {
    forumAPI.getCategories()
      .then(response => setCategories(response.data.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const mutate = async (operation, success) => {
    try {
      await operation();
      toast.success(success);
      await loadPosts();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = post => {
    setEditing(post);
    setForm({
      title: post.title,
      content: post.content,
      category: post.category,
      isAnonymous: post.isAnonymous
    });
    setShowModal(true);
  };

  const submitPost = async event => {
    event.preventDefault();
    try {
      setSubmitting(true);
      if (editing) await forumAPI.updatePost(editing._id, form);
      else await forumAPI.createPost(form);
      toast.success(editing ? 'Post updated' : 'Post created');
      setShowModal(false);
      await loadPosts();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = post => {
    mutate(
      () => post.hasLiked ? forumAPI.unlikePost(post._id) : forumAPI.likePost(post._id),
      post.hasLiked ? 'Like removed' : 'Post liked'
    );
  };

  const addReply = async postId => {
    const content = replyInputs[postId]?.trim();
    if (!content) return;
    try {
      setReplying(current => ({ ...current, [postId]: true }));
      await forumAPI.addComment(postId, { content });
      setReplyInputs(current => ({ ...current, [postId]: '' }));
      toast.success('Reply posted');
      await loadPosts();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setReplying(current => ({ ...current, [postId]: false }));
    }
  };

  const reportPost = post => {
    const reason = window.prompt('Please briefly explain why this post should be reviewed:');
    if (reason?.trim()) mutate(() => forumAPI.reportPost(post._id, reason.trim()), 'Report submitted for review');
  };

  return (
    <div className="space-y-6">
      <div className="page-hero flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-success-100 rounded-2xl shadow-soft"><Users className="h-6 w-6 text-success-600" /></div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Peer Support Forum</h1>
            <p className="text-neutral-600">Share experiences and support one another safely</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary inline-flex items-center justify-center px-4 py-2">
          <Plus className="mr-2 h-4 w-4" /> Create Post
        </button>
      </div>

      <div className="card">
        <form
          className="grid grid-cols-1 sm:grid-cols-4 gap-3"
          onSubmit={event => { event.preventDefault(); setSearch(searchInput.trim()); }}
        >
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
            <input
              className="form-input w-full pl-9"
              placeholder="Search posts..."
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
            />
          </div>
          <select className="form-input" value={category} onChange={event => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select className="form-input" value={sort} onChange={event => setSort(event.target.value)}>
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
          </select>
        </form>
      </div>

      {loading ? (
        <div className="card py-16 flex justify-center text-neutral-500"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading posts...</div>
      ) : error ? (
        <div className="card py-12 text-center">
          <p className="text-danger-600 mb-4">{error}</p>
          <button className="btn-outline" onClick={loadPosts}>Try again</button>
        </div>
      ) : posts.length === 0 ? (
        <div className="card py-16 text-center text-neutral-500">No posts match your filters. Start the conversation.</div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <article key={post._id} className="card">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="font-medium text-primary-600">{post.isAnonymous ? 'A' : displayName(post.authorId).charAt(0)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-900">{post.isAnonymous ? 'Anonymous' : displayName(post.authorId)}</span>
                    <span className="text-xs text-neutral-500">{new Date(post.createdAt).toLocaleString()}</span>
                    <span className="px-2 py-1 text-xs bg-neutral-100 rounded-full capitalize">{post.category?.replace('-', ' ')}</span>
                    {post.isPinned && <span className="inline-flex items-center text-xs text-primary-700"><Pin className="h-3 w-3 mr-1" />Pinned</span>}
                    <div className="ml-auto flex gap-2">
                      {post.isOwner && <button aria-label="Edit post" onClick={() => openEdit(post)} className="text-neutral-400 hover:text-primary-600"><Pencil className="h-4 w-4" /></button>}
                      {(post.isOwner || user?.role === 'admin') && (
                        <button aria-label="Delete post" onClick={() => window.confirm('Delete this post?') && mutate(() => forumAPI.deletePost(post._id), 'Post deleted')} className="text-neutral-400 hover:text-danger-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <h2 className="font-semibold text-lg text-neutral-900 mt-3">{post.title}</h2>
                  <p className="text-neutral-700 mt-2 whitespace-pre-wrap break-words">{post.content}</p>
                  <div className="flex flex-wrap items-center gap-5 mt-4 text-sm text-neutral-500">
                    <button onClick={() => toggleLike(post)} className={`inline-flex items-center ${post.hasLiked ? 'text-danger-600' : 'hover:text-danger-600'}`}>
                      <Heart className={`h-4 w-4 mr-1 ${post.hasLiked ? 'fill-current' : ''}`} />{post.likes?.length || 0}
                    </button>
                    <button onClick={() => setExpanded(current => ({ ...current, [post._id]: !current[post._id] }))} className="inline-flex items-center hover:text-primary-600">
                      <MessageCircle className="h-4 w-4 mr-1" />{post.comments?.length || 0} replies
                    </button>
                    <button disabled={post.hasReported} onClick={() => reportPost(post)} className="inline-flex items-center hover:text-warning-600 disabled:opacity-50">
                      <Flag className="h-4 w-4 mr-1" />{post.hasReported ? 'Reported' : 'Report'}
                    </button>
                    {user?.role === 'admin' && (
                      <button onClick={() => mutate(() => forumAPI.pinPost(post._id), post.isPinned ? 'Announcement unpinned' : 'Announcement pinned')} className="inline-flex items-center hover:text-primary-600">
                        <Pin className="h-4 w-4 mr-1" />{post.isPinned ? 'Unpin' : 'Pin announcement'}
                      </button>
                    )}
                  </div>

                  {expanded[post._id] && (
                    <div className="mt-5 pt-4 border-t border-neutral-100 space-y-3">
                      {[...(post.comments || [])].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).map(reply => (
                        <div key={reply._id} className={`rounded-lg p-3 ${reply.isPinned ? 'bg-primary-50 border border-primary-100' : 'bg-neutral-50'}`}>
                          <div className="flex flex-wrap gap-2 items-center text-xs text-neutral-500">
                            <strong className="text-neutral-800">{reply.isAnonymous ? 'Anonymous' : displayName(reply.authorId)}</strong>
                            <span>{new Date(reply.createdAt).toLocaleString()}</span>
                            {reply.isPinned && <span className="text-primary-700">Helpful response</span>}
                            <span className="ml-auto flex gap-2">
                              {['counselor', 'admin'].includes(user?.role) && (
                                <button onClick={() => mutate(() => forumAPI.pinComment(post._id, reply._id), reply.isPinned ? 'Reply unpinned' : 'Helpful reply pinned')} className="hover:text-primary-600">
                                  {reply.isPinned ? 'Unpin' : 'Pin'}
                                </button>
                              )}
                              {(user?.role === 'admin' || String(reply.authorId?._id || reply.authorId) === String(user?._id)) && (
                                <button onClick={() => mutate(() => forumAPI.removeComment(post._id, reply._id), 'Reply removed')} className="hover:text-danger-600">Remove</button>
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-neutral-700 mt-1 whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          className="form-input flex-1"
                          placeholder="Write a supportive reply..."
                          value={replyInputs[post._id] || ''}
                          onChange={event => setReplyInputs(current => ({ ...current, [post._id]: event.target.value }))}
                          onKeyDown={event => { if (event.key === 'Enter') addReply(post._id); }}
                        />
                        <button aria-label="Send reply" disabled={replying[post._id]} onClick={() => addReply(post._id)} className="btn-primary px-3">
                          {replying[post._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editing ? 'Edit Post' : 'Create a Post'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitPost} className="p-6 space-y-4">
              <input required minLength={3} maxLength={200} className="form-input w-full" placeholder="Title" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} />
              <select className="form-input w-full" value={form.category} onChange={event => setForm({ ...form, category: event.target.value })}>
                {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <textarea required minLength={3} maxLength={5000} className="form-input w-full h-36" placeholder="What would you like to share?" value={form.content} onChange={event => setForm({ ...form, content: event.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isAnonymous} onChange={event => setForm({ ...form, isAnonymous: event.target.checked })} />
                Hide my identity from the community
              </label>
              <div className="flex justify-end gap-3">
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button disabled={submitting} className="btn-primary">{submitting ? 'Saving...' : editing ? 'Save changes' : 'Publish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForumPage;
