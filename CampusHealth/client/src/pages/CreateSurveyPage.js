import React, { useEffect, useState } from 'react';
import { FileText, Send, PlusCircle, BarChart3 } from 'lucide-react';
import { surveyAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Correct hook

function SurveyTakePage() {
  const [surveys, setSurveys] = useState([]);
  const [activeSurvey, setActiveSurvey] = useState(null);
  const [answers, setAnswers] = useState({});
  const { user } = useAuth(); // Get current user from hook
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await surveyAPI.getActiveSurveys();
        setSurveys(res.data.surveys || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const startSurvey = (s) => {
    setActiveSurvey(s);
    setAnswers({});
  };

  const submit = async () => {
    try {
      const payload = {
        answers: Object.entries(answers).map(([k, v]) => ({
          questionIndex: Number(k),
          value: v,
        })),
      };
      await surveyAPI.submitSurvey(activeSurvey._id, payload);
      setActiveSurvey(null);
      navigate('/app/activities');
    } catch (e) {
      console.error(e);
    }
  };

  if (activeSurvey) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">{activeSurvey.title}</h1>
            <p className="text-neutral-600">Participate in this activity</p>
          </div>
        </div>

        <div className="card">
          <div className="space-y-5">
            {(activeSurvey.questions || []).map((q, i) => (
              <div key={i} className="space-y-2">
                <p className="font-medium text-neutral-900">
                  Q{i + 1}. {q.text}
                </p>
                <input
                  className="form-input"
                  placeholder="Your answer"
                  value={answers[i] ?? ''}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [i]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button className="btn-primary inline-flex items-center" onClick={submit}>
              <Send className="h-4 w-4 mr-2" /> Submit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-primary-100 rounded-lg">
          <FileText className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Activities</h1>
          <p className="text-neutral-600">Choose an activity to begin</p>
        </div>
      </div>

      {/* Action Buttons visible only to counselors */}
      {user?.role === 'counselor' && (
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            className="btn-primary inline-flex items-center"
            onClick={() => navigate('/app/activities/create')}
          >
            <PlusCircle className="h-4 w-4 mr-2" /> Create Activity
          </button>
          <button
            className="btn-secondary inline-flex items-center"
            onClick={() => navigate('/app/activities/analyze')}
          >
            <BarChart3 className="h-4 w-4 mr-2" /> Analyze Score
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {surveys.map((s) => (
          <div key={s._id} className="card">
            <h3 className="font-semibold text-neutral-900 mb-2">{s.title}</h3>
            <p className="text-sm text-neutral-600 mb-4">{s.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-500">
                {(s.questions || []).length} questions
              </span>
              <button className="btn-primary" onClick={() => startSurvey(s)}>
                Start
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SurveyTakePage;
