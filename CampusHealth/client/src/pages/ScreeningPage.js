import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle, Clock, TrendingUp, ArrowRight, RefreshCw } from 'lucide-react';
import { screeningAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

function ScreeningPage() {
  const { t } = useLanguage();
  const [selectedScreening, setSelectedScreening] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [recentScreenings, setRecentScreenings] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screeningResult, setScreeningResult] = useState(null);
  const [submitError, setSubmitError] = useState('');

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await screeningAPI.getHistory({ limit: 5 });
      setRecentScreenings(response.data.screenings || []);
    } catch (error) {
      console.error('Failed to fetch screening history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const scoreOptions = [
    t('notAtAll'),
    t('severalDays'),
    t('moreThanHalfDays'),
    t('nearlyEveryDay')
  ];

  const screenings = {
    phq9: {
      name: 'PHQ-9',
      description: t('phqDescription'),
      duration: '2-3 min',
      icon: Heart,
      color: 'danger',
      questions: [
        t('phqQ1'),
        t('phqQ2'),
        t('phqQ3'),
        t('phqQ4'),
        t('phqQ5'),
        t('phqQ6'),
        t('phqQ7'),
        t('phqQ8'),
        t('phqQ9')
      ]
    },
    gad7: {
      name: 'GAD-7',
      description: t('gadDescription'),
      duration: '2-3 min',
      icon: TrendingUp,
      color: 'warning',
      questions: [
        t('gadQ1'),
        t('gadQ2'),
        t('gadQ3'),
        t('gadQ4'),
        t('gadQ5'),
        t('gadQ6'),
        t('gadQ7')
      ]
    },
    pss10: {
      name: 'PSS-10',
      description: t('pssDescription'),
      duration: '3-4 min',
      icon: CheckCircle,
      color: 'success',
      questions: [
        t('pssQ1'),
        t('pssQ2'),
        t('pssQ3'),
        t('pssQ4'),
        t('pssQ5'),
        t('pssQ6'),
        t('pssQ7'),
        t('pssQ8'),
        t('pssQ9'),
        t('pssQ10')
      ]
    }
  };

  const startScreening = (screeningType) => {
    setSelectedScreening(screeningType);
    setCurrentQuestion(0);
    setAnswers(
      screenings[screeningType].questions.reduce((initialAnswers, _question, index) => ({
        ...initialAnswers,
        [index]: 0
      }), {})
    );
    setScreeningResult(null);
    setSubmitError('');
  };

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const nextQuestion = async () => {
    if (currentQuestion < screenings[selectedScreening].questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      // Complete screening
      try {
        setIsSubmitting(true);
        const backendType = screenings[selectedScreening].name;
        const formattedResponses = screenings[selectedScreening].questions.map((_question, index) => ({
          questionId: `q${index + 1}`,
          response: Number(answers[index] ?? 0)
        }));
        
        const response = await screeningAPI.submitScreening({
          type: backendType,
          responses: formattedResponses
        });
        
        setScreeningResult(response.data.results);
        setSubmitError('');
        fetchHistory(); // refresh history
      } catch (error) {
        console.error('Failed to submit screening:', error);
        const validationMessage = error.response?.data?.errors?.[0]?.msg;
        setSubmitError(validationMessage || error.response?.data?.message || t('screeningSubmitError'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  if (selectedScreening) {
    const screening = screenings[selectedScreening];
    const currentAnswer = answers[currentQuestion] ?? 0;
    
    return (
      <div className="space-y-6" translate="no">
        {submitError && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
            {submitError}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 bg-${screening.color}-100 rounded-lg`}>
              <screening.icon className={`h-6 w-6 text-${screening.color}-600`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">{screening.name}</h1>
              <p className="text-neutral-600">{screening.description}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedScreening(null)}
            className="text-neutral-500 hover:text-neutral-700"
          >
            ✕
          </button>
        </div>

        <div className="card">
          {screeningResult ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-8 w-8 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">{t('screeningCompleted')}</h2>
              <p className="text-neutral-600 mb-8">{t('screeningThanks')}</p>
              
              <div className="bg-neutral-50 rounded-xl p-6 max-w-md mx-auto mb-8 text-left border border-neutral-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-neutral-600 font-medium">{t('totalScore')}</span>
                  <span className="text-2xl font-bold text-neutral-900">{screeningResult.totalScore}</span>
                </div>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-neutral-600 font-medium">{t('severityLevel')}</span>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 capitalize">
                    {screeningResult.severity.replace('-', ' ')}
                  </span>
                </div>
                
                {screeningResult.recommendations && screeningResult.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-neutral-900 mb-3">{t('recommendations')}</h4>
                    <ul className="space-y-2 text-sm text-neutral-600 list-disc list-inside">
                      {screeningResult.recommendations.map((rec, idx) => (
                        <li key={idx} className="capitalize">{rec.replace('-', ' ')}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedScreening(null)}
                className="btn-primary inline-flex items-center"
              >
                {t('returnToScreenings')}
              </button>
            </div>
          ) : (
            <>
          <div className="mb-4">
            <div className="flex justify-between text-sm text-neutral-600 mb-2">
              <span>{t('questionProgress', { current: currentQuestion + 1, total: screening.questions.length })}</span>
              <span>{t('percentComplete', { percent: Math.round(((currentQuestion + 1) / screening.questions.length) * 100) })}</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / screening.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-neutral-900 mb-4">
              {screening.questions[currentQuestion]}
            </h3>
            
            <div className="space-y-3">
              {scoreOptions.map((option, index) => (
                <label key={`${selectedScreening}-${currentQuestion}-${index}`} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion}`}
                    value={index}
                    checked={currentAnswer === index}
                    onChange={() => handleAnswer(currentQuestion, index)}
                    className="form-radio"
                  />
                  <span className="text-neutral-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('previous')}
            </button>
            <button
              onClick={nextQuestion}
              disabled={currentAnswer === undefined || isSubmitting}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> {t('submitting')}
                </>
              ) : currentQuestion === screening.questions.length - 1 ? t('complete') : (
                <>{t('next')} <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" translate="no">
      <div className="flex items-center space-x-4">
        <div className="p-4 bg-danger-100 rounded-xl">
          <Heart className="h-8 w-8 text-danger-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{t('screeningFull')}</h1>
          <p className="text-neutral-600 text-lg">{t('screeningDescription')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Object.entries(screenings).map(([key, screening]) => {
          const Icon = screening.icon;
          return (
            <div key={key} className="card h-full flex flex-col">
              <div className="flex items-center space-x-4 mb-6">
                <div className={`p-3 bg-${screening.color}-100 rounded-xl`}>
                  <Icon className={`h-6 w-6 text-${screening.color}-600`} />
                </div>
                <h3 className="font-semibold text-neutral-900 text-xl">{screening.name}</h3>
              </div>
              <p className="text-neutral-600 mb-6 leading-relaxed flex-1">
                {screening.description}
              </p>
              <div className="flex items-center justify-between text-sm text-neutral-500 mb-6">
                <span className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  {screening.duration}
                </span>
                <span className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {screening.questions.length} {t('questions')}
                </span>
              </div>
              <button 
                onClick={() => startScreening(key)}
                className="w-full btn-primary hover:scale-105 transition-transform py-3 text-lg"
              >
                {t('takeScreening')}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="text-2xl font-semibold text-neutral-900 mb-6">{t('recentScreenings')}</h2>
        {isLoadingHistory ? (
          <div className="text-center py-12 text-neutral-500">
            <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
            <p className="text-sm">{t('loadingHistory')}</p>
          </div>
        ) : recentScreenings.length > 0 ? (
          <div className="space-y-4">
            {recentScreenings.map((record) => (
              <div key={record._id} className="flex items-center justify-between p-4 border border-neutral-100 rounded-lg hover:border-neutral-200 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-neutral-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-neutral-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-neutral-900">{record.type} Screening</h4>
                    <p className="text-sm text-neutral-500">{new Date(record.completedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 capitalize">
                    {record.severity.replace('-', ' ')}
                  </span>
                  <p className="text-xs text-neutral-500 mt-1">{t('score')}: {record.totalScore}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <Heart className="h-16 w-16 mx-auto mb-6 text-neutral-300" />
            <p className="text-lg mb-2">{t('beginWellbeingHistory')}</p>
            <p className="text-base">{t('firstScreeningMessage')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScreeningPage;
