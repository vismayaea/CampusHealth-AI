import React, { useState } from 'react';
import {
  AlertCircle,
  Download,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { adminAPI } from '../../services/api';

const reportTypes = [
  { value: 'user-activity', label: 'User Activity' },
  { value: 'mental-health-trends', label: 'Mental Health Trends' },
  { value: 'resource-usage', label: 'Resource Usage' },
  { value: 'appointment-summary', label: 'Appointment Summary' }
];

const toDateInput = (date) => date.toISOString().slice(0, 10);
const today = new Date();
const thirtyDaysAgo = new Date(today);
thirtyDaysAgo.setDate(today.getDate() - 30);

const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
};

function AdminReportsPage() {
  const [filters, setFilters] = useState({
    type: 'appointment-summary',
    startDate: toDateInput(thirtyDaysAgo),
    endDate: toDateInput(today)
  });
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateReport = async () => {
    if (filters.startDate > filters.endDate) {
      setError('Start date cannot be after end date.');
      setReport(null);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await adminAPI.generateReport(filters);
      setReport(response.data);
    } catch (requestError) {
      setReport(null);
      setError(requestError.response?.data?.message || 'Failed to generate report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    generateReport();
  };

  const downloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.reportType}-${filters.startDate}-to-${filters.endDate}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const reportEntries = Object.entries(report?.data || {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary-100 rounded-lg">
            <FileText className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Reports</h1>
            <p className="text-neutral-600">Generate and export administrative reports</p>
          </div>
        </div>
        {report && (
          <button type="button" onClick={downloadReport} className="btn-outline inline-flex items-center justify-center">
            <Download className="mr-2 h-4 w-4" />
            Download JSON
          </button>
        )}
      </div>

      <form className="card" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="report-type" className="block text-sm font-medium text-neutral-700 mb-2">Report type</label>
            <select
              id="report-type"
              className="form-input"
              value={filters.type}
              onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
            >
              {reportTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="report-start-date" className="block text-sm font-medium text-neutral-700 mb-2">Start date</label>
            <input
              id="report-start-date"
              type="date"
              className="form-input"
              value={filters.startDate}
              max={filters.endDate}
              onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="report-end-date" className="block text-sm font-medium text-neutral-700 mb-2">End date</label>
            <input
              id="report-end-date"
              type="date"
              className="form-input"
              value={filters.endDate}
              min={filters.startDate}
              onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 btn-primary inline-flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
          {isLoading ? 'Generating…' : 'Generate Report'}
        </button>
      </form>

      {error ? (
        <div className="card py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-danger-500" />
          <h2 className="text-lg font-semibold text-neutral-900">Unable to generate report</h2>
          <p className="text-danger-600 mt-2 mb-5">{error}</p>
          <button type="button" onClick={generateReport} disabled={isLoading} className="btn-outline inline-flex items-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </button>
        </div>
      ) : report ? (
        <div className="space-y-5">
          <div className="card">
            <h2 className="text-xl font-semibold text-neutral-900">
              {reportTypes.find((type) => type.value === report.reportType)?.label || report.reportType}
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              {new Date(report.startDate).toLocaleDateString()} – {new Date(report.endDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Generated {new Date(report.generatedAt).toLocaleString()}</p>
          </div>

          {reportEntries.length === 0 ? (
            <div className="card py-16 text-center text-neutral-500">This report range has no matching records. Try a broader date range to include more campus activity.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {reportEntries.map(([key, value]) => (
                <div key={key} className="card">
                  <p className="text-sm font-medium text-neutral-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  {typeof value === 'object' && value !== null ? (
                    <pre className="mt-3 text-sm text-neutral-800 whitespace-pre-wrap break-words overflow-auto">{displayValue(value)}</pre>
                  ) : (
                    <p className="mt-2 text-2xl font-bold text-neutral-900">{displayValue(value)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card py-16 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-neutral-300" />
          <h2 className="text-lg font-semibold text-neutral-900">Generate an operational report</h2>
          <p className="text-neutral-500 mt-2">Select a report type and date range, then generate a report.</p>
        </div>
      )}
    </div>
  );
}

export default AdminReportsPage;
