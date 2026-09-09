import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Search, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { forumAPI } from '../../services/api';

const errorMessage = error => error.response?.data?.message || 'Unable to complete moderation action';

function AdminForumPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await forumAPI.getReports();
      setPosts(response.data.posts || []);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  const moderate = async (id, action) => {
    try {
      await forumAPI.moderateReports(id, action);
      toast.success(action === 'remove' ? 'Post removed' : 'Reports dismissed');
      await loadReports();
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    }
  };

  const visible = posts.filter(post =>
    `${post.title} ${post.content}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-success-100 rounded-lg"><Users className="h-6 w-6 text-success-600" /></div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Forum Management</h1>
          <p className="text-neutral-600">Review community reports and moderate content</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-warning-600" /><span className="font-semibold">Reported posts</span></div>
          <p className="text-3xl font-bold mt-3">{posts.length}</p>
        </div>
      </div>

      <div className="card">
        <div className="relative max-w-lg">
          <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
          <input className="form-input w-full pl-9" placeholder="Search reported posts..." value={search} onChange={event => setSearch(event.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="card py-16 flex justify-center text-neutral-500"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading reports...</div>
      ) : error ? (
        <div className="card py-12 text-center"><p className="text-danger-600 mb-4">{error}</p><button className="btn-outline" onClick={loadReports}>Try again</button></div>
      ) : visible.length === 0 ? (
        <div className="card py-16 text-center text-neutral-500">No forum reports require moderation.</div>
      ) : (
        <div className="space-y-4">
          {visible.map(post => {
            const pending = (post.reportedBy || []).filter(report => report.status === 'pending');
            return (
              <article key={post._id} className="card">
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
                      <span className="font-medium text-neutral-800">{post.isAnonymous ? `Anonymous (${post.authorId?.email || 'identity available to admin'})` : post.authorId?.name}</span>
                      <span>{pending.length} pending report{pending.length === 1 ? '' : 's'}</span>
                      <span className="capitalize">{post.category?.replace('-', ' ')}</span>
                    </div>
                    <h2 className="font-semibold text-lg mt-2">{post.title}</h2>
                    <p className="text-neutral-700 mt-1 whitespace-pre-wrap">{post.content}</p>
                    <div className="mt-3 space-y-1">
                      {pending.map(report => (
                        <p key={report._id} className="text-sm bg-warning-50 text-warning-800 rounded p-2">
                          <strong>{report.userId?.name || report.userId?.email || 'User'}:</strong> {report.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="flex md:flex-col gap-2 flex-shrink-0">
                    <button className="btn-outline inline-flex items-center justify-center" onClick={() => moderate(post._id, 'dismiss')}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Dismiss
                    </button>
                    <button className="btn-danger inline-flex items-center justify-center" onClick={() => window.confirm('Remove this reported post?') && moderate(post._id, 'remove')}>
                      <Trash2 className="h-4 w-4 mr-1" /> Remove post
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminForumPage;
