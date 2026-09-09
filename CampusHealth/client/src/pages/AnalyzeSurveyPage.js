import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Correct hook
import { surveyAPI } from '../services/api';

function CreateSurveyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState(['']); // Start with 1 empty question

  if (user?.role !== 'counselor') {
    return <p className="text-red-500">You do not have permission to create surveys.</p>;
  }

  const addQuestion = () => setQuestions([...questions, '']);
  const updateQuestion = (index, value) => {
    const updated = [...questions];
    updated[index] = value;
    setQuestions(updated);
  };

  const submitSurvey = async () => {
    try {
      await surveyAPI.createSurvey({
        title,
        description,
        questions: questions.map((question) => ({ text: question, type: 'single' }))
      });
      navigate('/app/activities');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-neutral-900">Create Survey</h1>
      <div className="space-y-3">
        <input
          className="form-input"
          placeholder="Survey Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="form-input"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="space-y-2">
          {questions.map((q, idx) => (
            <input
              key={idx}
              className="form-input"
              placeholder={`Question ${idx + 1}`}
              value={q}
              onChange={(e) => updateQuestion(idx, e.target.value)}
            />
          ))}
        </div>
        <button className="btn-secondary" onClick={addQuestion}>
          Add Question
        </button>
        <button className="btn-primary" onClick={submitSurvey}>
          Create Survey
        </button>
      </div>
    </div>
  );
}

export default CreateSurveyPage;
