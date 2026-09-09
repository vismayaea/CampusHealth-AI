import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Search, Trash2, Eye, X, AlertCircle, CheckCircle } from 'lucide-react';
import { resourcesAPI } from '../../services/api';

function AdminResourcesPage() {
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    type: 'article',
    category: 'general',
    language: 'en',
    author: 'Admin',
    fileUrl: '',
    thumbnailUrl: ''
  });

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await resourcesAPI.getResources({ search: searchTerm });
      setResources(res.data.resources || []);
      setError('');
    } catch (error) {
      console.error('Failed to load resources', error);
      setError('Resource library content could not be loaded. Please retry after a moment.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => fetchResources(), 500);
    return () => clearTimeout(timer);
  }, [fetchResources]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await resourcesAPI.deleteResource(id);
      setResources(resources.filter(r => r._id !== id));
      setNotice('Resource removed from the library.');
      setError('');
    } catch (error) {
      console.error('Failed to delete resource', error);
      setError('Resource could not be deleted. Please try again.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await resourcesAPI.createResource({
         ...formData,
         isActive: true,
         isApproved: true // Admins bypass moderation
      });
      // Add the new resource to state
      setResources([res.data.resource || res.data, ...resources]);
      setShowModal(false);
      // Reset form
      setFormData({
        title: '', description: '', content: '', type: 'article', category: 'general',
        language: 'en', author: 'Admin', fileUrl: '', thumbnailUrl: ''
      });
      setNotice('Resource created and published successfully.');
      setError('');
      fetchResources();
    } catch (error) {
      console.error('Failed to create resource', error);
      setError(error.response?.data?.message || 'Resource could not be created. Please review the required fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-warning-100 rounded-lg">
            <BookOpen className="h-6 w-6 text-warning-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Resource Management</h1>
            <p className="text-neutral-600">Manage mental health resources and content</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn-primary inline-flex items-center px-4 py-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Search resources by title or tag..."
              className="form-input pl-10 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 inline-flex items-center">
          <CheckCircle className="h-4 w-4 mr-2" /> {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 flex items-center justify-between gap-4">
          <span className="inline-flex items-center"><AlertCircle className="h-4 w-4 mr-2" /> {error}</span>
          <button type="button" className="font-medium underline" onClick={fetchResources}>Retry</button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-neutral-500">Loading resources...</div>
      ) : resources.length === 0 ? (
        <div className="card text-center py-12 text-neutral-500">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
          <p className="font-semibold text-neutral-800">Explore curated mental wellness resources.</p>
          <p className="mt-1 text-sm">Add an official article, guide, or helpline to grow the campus library.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <div key={resource._id} className="card flex flex-col h-full">
              <div className="aspect-video bg-neutral-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                 {resource.thumbnailUrl ? (
                   <img src={resource.thumbnailUrl} alt={resource.title} className="w-full h-full object-cover" />
                 ) : (
                   <BookOpen className="h-12 w-12 text-primary-400" />
                 )}
                 <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-medium capitalize shadow-sm">
                   {resource.type}
                 </div>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2 line-clamp-2" title={resource.title}>{resource.title}</h3>
              <p className="text-sm text-neutral-600 mb-4 line-clamp-3 flex-grow" title={resource.description}>
                {resource.description}
              </p>
              <div className="flex items-center justify-between text-xs text-neutral-500 mb-4">
                <span className="capitalize">{resource.category?.replace('-', ' ')}</span>
                <span className="uppercase">{resource.language || 'EN'}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                <div className="flex items-center space-x-3">
                  {resource.fileUrl && (
                    <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-900" title="View Resource File">
                      <Eye className="h-4 w-4" />
                    </a>
                  )}
                  <button onClick={() => handleDelete(resource._id)} className="text-danger-600 hover:text-danger-900 ml-auto" title="Delete Resource">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${resource.isActive ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'}`}>
                  {resource.isActive ? 'Active' : 'Draft'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">Add New Resource</h2>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateResource} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Title *</label>
                  <input required type="text" name="title" value={formData.title} onChange={handleChange} className="form-input w-full" placeholder="Resource Title" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Author *</label>
                  <input required type="text" name="author" value={formData.author} onChange={handleChange} className="form-input w-full" placeholder="e.g., Dr. Smith or Campus Health" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Short Description *</label>
                <textarea required name="description" value={formData.description} onChange={handleChange} className="form-input w-full h-20" placeholder="Brief overview of the resource..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Content/Body *</label>
                <textarea required name="content" value={formData.content} onChange={handleChange} className="form-input w-full h-32" placeholder="Full text content, article body, or detailed instructions..."></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Resource Type *</label>
                  <select name="type" value={formData.type} onChange={handleChange} className="form-input w-full">
                    <option value="article">Article</option>
                    <option value="video">Video</option>
                    <option value="audio">Audio</option>
                    <option value="infographic">Infographic</option>
                    <option value="worksheet">Worksheet</option>
                    <option value="exercise">Exercise</option>
                    <option value="meditation">Meditation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange} className="form-input w-full">
                    <option value="anxiety">Anxiety</option>
                    <option value="depression">Depression</option>
                    <option value="stress">Stress</option>
                    <option value="mindfulness">Mindfulness</option>
                    <option value="coping-skills">Coping Skills</option>
                    <option value="relationships">Relationships</option>
                    <option value="academic">Academic</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Language *</label>
                  <select name="language" value={formData.language} onChange={handleChange} className="form-input w-full">
                    <option value="en">English (en)</option>
                    <option value="hi">Hindi (hi)</option>
                    <option value="ta">Tamil (ta)</option>
                    <option value="te">Telugu (te)</option>
                    <option value="bn">Bengali (bn)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">External Link / File URL</label>
                  <input type="url" name="fileUrl" value={formData.fileUrl} onChange={handleChange} className="form-input w-full" placeholder="https://youtube.com/..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Thumbnail Cover URL</label>
                  <input type="url" name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange} className="form-input w-full" placeholder="https://images.unsplash.com/..." />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline px-6 py-2">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary px-6 py-2 flex items-center">
                  {isSubmitting ? 'Publishing...' : 'Publish Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminResourcesPage;
