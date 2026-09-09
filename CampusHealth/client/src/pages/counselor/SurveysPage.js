import React, { useEffect, useState } from 'react';
import { Plus, BarChart3, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { surveyAPI } from '../../services/api';

function SurveysPage() {
  const [surveys, setSurveys] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ text: '', type: 'single' }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const fetchSurveys = async () => {
    try {
      const res = await surveyAPI.getMySurveys();
      setSurveys(res.data.surveys || []);
      setError('');
    } catch (e) {
      console.error(e);
      setError('Activity analysis records could not be loaded. Please try again.');
    }
  };

  useEffect(() => { fetchSurveys(); }, []);

  const addQuestion = () => setQuestions(q => [...q, { text: '', type: 'single' }]);
  const updateQuestion = (i, val) => {
    const q = [...questions];
    q[i].text = val;
    setQuestions(q);
  };

  const createSurvey = async () => {
    if (!title.trim()) {
      setError('Please add a clear title before publishing this activity.');
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = { title, description, questions };
      await surveyAPI.createSurvey(payload);
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setQuestions([{ text: '', type: 'single' }]);
      setNotice('Activity analysis survey published successfully.');
      setError('');
      fetchSurveys();
    } catch (e) {
      console.error(e);
      setError('Activity analysis survey could not be created. Please review the form and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Activity Analysis</h1>
            <p className="text-neutral-600">Create activities and view student participation</p>
          </div>
        </div>
        <button className="btn-primary inline-flex items-center" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Activity
        </button>
      </div>

      {showCreate && (
        <div className="card border-primary-200 border-2">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Create New Activity / Survey</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
              <input className="form-input w-full" placeholder="e.g. Weekly Mental Check-in" value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
              <textarea className="form-input w-full h-20" placeholder="Instructions for students..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-neutral-700">Questions</label>
              {questions.map((q, i) => (
                <div key={i} className="flex space-x-2">
                  <span className="mt-2 font-medium text-neutral-500">{i+1}.</span>
                  <input className="form-input flex-1" placeholder="What do you want to ask?" value={q.text} onChange={e => updateQuestion(i, e.target.value)} />
                </div>
              ))}
              <button className="btn-outline text-sm" onClick={addQuestion}>+ Add Another Question</button>
            </div>
            <div className="flex space-x-3 pt-4 border-t border-neutral-100">
              <button className="btn-secondary px-6" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary px-6 inline-flex items-center" onClick={createSurvey} disabled={isSubmitting}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Activity
              </button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700">
          {notice}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700 inline-flex items-center">
          <AlertCircle className="h-4 w-4 mr-2" /> {error}
        </div>
      )}

      {surveys.length === 0 ? (
        <div className="card text-center py-12 text-neutral-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
          <p className="font-semibold text-neutral-800">Create a wellness activity analysis.</p>
          <p className="mt-1 text-sm">Publish a short check-in to understand student participation and wellbeing trends.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map(s => (
            <div key={s._id} className="card flex flex-col h-full">
              <h3 className="font-semibold text-neutral-900 mb-2">{s.title}</h3>
              <p className="text-sm text-neutral-600 mb-4 flex-grow">{s.description || 'No description provided.'}</p>
              
              <div className="flex items-center justify-between py-3 border-t border-b border-neutral-100 mb-4">
                 <div className="text-center">
                    <span className="block text-xl font-bold text-primary-600">{s.responseCount || 0}</span>
                    <span className="text-xs text-neutral-500 uppercase">Responses</span>
                 </div>
                 <div className="text-center">
                    <span className="block text-xl font-bold text-neutral-700">{(s.questions||[]).length}</span>
                    <span className="text-xs text-neutral-500 uppercase">Questions</span>
                 </div>
              </div>

              <a href={`/app/activities/${s._id}/results`} className="btn-outline w-full justify-center inline-flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analyze Results
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SurveysPage;

