import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, Clock, ExternalLink } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { resourcesAPI } from '../services/api';

function ResourceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resource, setResource] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    resourcesAPI.getResource(id)
      .then((response) => setResource(response.data.resource))
      .catch(() => setError('This resource could not be loaded.'));
  }, [id]);

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-neutral-700 mb-4">{error}</p>
        <button type="button" onClick={() => navigate('/app/resources')} className="btn-primary">Back to Resources</button>
      </div>
    );
  }

  if (!resource) {
    return <div className="card text-center py-12 text-neutral-600">Loading resource...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button type="button" onClick={() => navigate('/app/resources')} className="inline-flex items-center text-neutral-600 hover:text-primary-600">
        <ArrowLeft className="h-5 w-5 mr-2" aria-hidden="true" /> Back to Resources
      </button>
      <article className="card">
        <div className="h-48 rounded-xl bg-primary-50 flex items-center justify-center mb-6">
          <BookOpen className="h-16 w-16 text-primary-600" aria-hidden="true" />
        </div>
        <p className="text-sm font-medium text-primary-700 uppercase tracking-wide mb-2">{resource.category?.replace('-', ' ')}</p>
        <h1 className="text-3xl font-bold text-neutral-900 mb-3">{resource.title}</h1>
        <p className="text-lg text-neutral-600 mb-5">{resource.description}</p>
        <div className="flex flex-wrap gap-4 text-sm text-neutral-500 mb-6">
          <span>Source: {resource.author}</span>
          <span className="inline-flex items-center"><Clock className="h-4 w-4 mr-1" aria-hidden="true" /> {resource.duration || 5} min read</span>
        </div>
        <p className="text-neutral-700 leading-relaxed mb-7">{resource.content}</p>
        <a href={resource.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center">
          Open Official Resource <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
        </a>
      </article>
    </div>
  );
}

export default ResourceDetailPage;
