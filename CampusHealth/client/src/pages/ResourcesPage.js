import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle, BookOpen, Brain, Clock, ExternalLink, GraduationCap,
  HeartHandshake, RefreshCw, Search, ShieldCheck, Sparkles, Wind
} from 'lucide-react';
import { resourcesAPI } from '../services/api';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'anxiety', label: 'Anxiety & Panic' },
  { value: 'depression', label: 'Depression' },
  { value: 'stress', label: 'Stress & Burnout' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'coping-skills', label: 'Self Care & Coping' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'academic', label: 'Student Wellbeing' },
  { value: 'general', label: 'Sleep & General Wellbeing' }
];

const categoryStyles = {
  anxiety: { Icon: Wind, panel: 'bg-blue-50', icon: 'text-blue-600' },
  depression: { Icon: ShieldCheck, panel: 'bg-indigo-50', icon: 'text-indigo-600' },
  stress: { Icon: Brain, panel: 'bg-rose-50', icon: 'text-rose-600' },
  mindfulness: { Icon: Sparkles, panel: 'bg-violet-50', icon: 'text-violet-600' },
  'coping-skills': { Icon: HeartHandshake, panel: 'bg-emerald-50', icon: 'text-emerald-600' },
  relationships: { Icon: HeartHandshake, panel: 'bg-pink-50', icon: 'text-pink-600' },
  academic: { Icon: GraduationCap, panel: 'bg-amber-50', icon: 'text-amber-600' },
  general: { Icon: BookOpen, panel: 'bg-cyan-50', icon: 'text-cyan-600' }
};

function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const fetchResources = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await resourcesAPI.getResources({
        search: searchTerm.trim() || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        limit: 100,
        sortBy: 'viewCount',
        sortOrder: 'desc'
      });
      setResources(response.data.resources || []);
    } catch (requestError) {
      console.error('Failed to fetch resources:', requestError);
      setError('The resource library could not be loaded. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(fetchResources, searchTerm ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchResources, retryKey, searchTerm]);

  return (
    <div className="space-y-8">
      <header className="page-hero flex items-center space-x-4">
        <div className="p-4 bg-warning-100 rounded-2xl shadow-soft">
          <BookOpen className="h-8 w-8 text-warning-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Mental Health Resources</h1>
          <p className="text-neutral-600 text-lg">Trusted guidance from official public-health organizations</p>
        </div>
      </header>

      <section className="card" aria-label="Filter resources">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="relative flex-1">
            <span className="sr-only">Search resources</span>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search by topic, source, or keyword..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="form-input pl-12 w-full py-3"
            />
          </label>
          <label>
            <span className="sr-only">Filter by category</span>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="form-select w-full sm:w-64 py-3"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>{category.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading resources">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="card animate-pulse">
              <div className="h-36 rounded-xl bg-neutral-100 mb-5" />
              <div className="h-5 rounded bg-neutral-100 mb-3" />
              <div className="h-16 rounded bg-neutral-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-12" role="alert">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-danger-500" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">Unable to load resources</h2>
          <p className="text-neutral-600 mb-5">{error}</p>
          <button type="button" onClick={() => setRetryKey((value) => value + 1)} className="btn-primary inline-flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" /> Retry
          </button>
        </div>
      ) : resources.length === 0 ? (
        <div className="card text-center py-12">
          <BookOpen className="h-16 w-16 mx-auto mb-4 text-neutral-300" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">No resources match your filters</h2>
          <p className="text-neutral-600 mb-5">Try another search term or view all categories.</p>
          <button type="button" onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} className="btn-outline">
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-neutral-900">
              {selectedCategory === 'all' ? 'Explore the library' : categories.find(({ value }) => value === selectedCategory)?.label}
            </h2>
            <span className="text-sm text-neutral-500">{resources.length} resource{resources.length === 1 ? '' : 's'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => {
              const presentation = categoryStyles[resource.category] || categoryStyles.general;
              const ResourceIcon = presentation.Icon;
              return (
                <article key={resource._id || resource.id} className="card-hover flex h-full flex-col">
                  <div className={`${presentation.panel} h-36 rounded-xl mb-5 flex items-center justify-center`}>
                    <ResourceIcon className={`h-12 w-12 ${presentation.icon}`} aria-hidden="true" />
                  </div>
                  <div className="flex items-center justify-between gap-3 mb-3 text-xs font-medium">
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-700">
                      {categories.find(({ value }) => value === resource.category)?.label || 'Wellbeing'}
                    </span>
                    <span className="inline-flex items-center text-neutral-500">
                      <Clock className="h-3.5 w-3.5 mr-1" aria-hidden="true" /> {resource.duration || 5} min read
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{resource.title}</h3>
                  <p className="text-sm text-neutral-600 mb-4 flex-1">{resource.description}</p>
                  <p className="text-sm font-medium text-neutral-700 mb-3">Source: {resource.author}</p>
                  {resource.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5" aria-label="Resource tags">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs text-neutral-500">#{tag.replace(/\s+/g, '-')}</span>
                      ))}
                    </div>
                  )}
                  <a
                    href={resource.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full inline-flex items-center justify-center"
                    aria-label={`Open ${resource.title} on ${resource.author} in a new tab`}
                  >
                    Open Official Resource <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
                  </a>
                </article>
              );
            })}
          </div>
        </>
      )}

      <p className="text-sm text-neutral-500 text-center">
        Links open official third-party websites in a new tab. These resources provide education, not a diagnosis or emergency care.
      </p>
    </div>
  );
}

export default ResourcesPage;
