import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { surveyAPI } from '../../services/api';
import { useParams } from 'react-router-dom';

function SurveyResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await surveyAPI.getSurveyResults(id);
        setData(res.data);
      } catch (e) { console.error(e); }
    })();
  }, [id]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-primary-100 rounded-lg">
          <BarChart3 className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{data.survey.title} - Activity Results</h1>
          <p className="text-neutral-600">{(data.responses||[]).length} participations</p>
        </div>
      </div>

      <div className="card">
        <div className="space-y-4">
          {(data.survey.questions||[]).map((q, i) => (
            <div key={i}>
              <h3 className="font-medium text-neutral-900 mb-2">Q{i+1}. {q.text}</h3>
              <ul className="list-disc ml-6 text-sm text-neutral-700">
                {(data.responses||[]).map((r, ri) => (
                  <li key={ri}>{r.student.firstName} {r.student.lastName}: {JSON.stringify((r.answers||[]).find(a => a.questionIndex===i)?.value ?? '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SurveyResultsPage;

