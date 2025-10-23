
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/bottom-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { 
  Activity,
  AlertCircle,
  FileText,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

interface SymptomLog {
  id: string;
  date: string;
  symptomType: string;
  severity: string;
  notes?: string;
}

const SYMPTOM_TYPES = [
  { value: 'pain', label: 'Pain', icon: '😣' },
  { value: 'discomfort', label: 'Discomfort', icon: '😐' },
  { value: 'soreness', label: 'Soreness', icon: '😖' },
  { value: 'sensitivity', label: 'Sensitivity', icon: '🦷' },
  { value: 'pressure', label: 'Pressure', icon: '💪' },
  { value: 'other', label: 'Other', icon: '📝' },
];

const SEVERITY_LEVELS = [
  { value: 'mild', label: 'Mild', color: '#4ADE80' },
  { value: 'moderate', label: 'Moderate', color: '#FBBF24' },
  { value: 'severe', label: 'Severe', color: '#F87171' },
];

export default function LogPage() {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  
  const [symptoms, setSymptoms] = useState<SymptomLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState('pain');
  const [selectedSeverity, setSelectedSeverity] = useState('mild');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchSymptoms();
    }
  }, [status, router]);

  const fetchSymptoms = async () => {
    try {
      const response = await fetch('/api/symptoms?days=30');
      if (response.ok) {
        setSymptoms(await response.json());
      }
    } catch (error) {
      console.error('Failed to fetch symptoms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLog = async (type: string, severity: string) => {
    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomType: type,
          severity,
        }),
      });

      if (response.ok) {
        const newSymptom = await response.json();
        setSymptoms([newSymptom, ...symptoms]);
      }
    } catch (error) {
      console.error('Failed to log symptom:', error);
    }
  };

  const handleDetailedLog = async () => {
    if (!selectedType || !selectedSeverity) return;

    setSaving(true);

    try {
      const response = await fetch('/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomType: selectedType,
          severity: selectedSeverity,
          notes,
        }),
      });

      if (response.ok) {
        const newSymptom = await response.json();
        setSymptoms([newSymptom, ...symptoms]);
        setShowAddModal(false);
        setNotes('');
        setSelectedType('pain');
        setSelectedSeverity('mild');
      }
    } catch (error) {
      console.error('Failed to log symptom:', error);
    } finally {
      setSaving(false);
    }
  };

  const deleteSymptom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;

    try {
      const response = await fetch(`/api/symptoms?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSymptoms(symptoms.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete symptom:', error);
    }
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#AF4B6C' }} />
      </div>
    );
  }

  // Group symptoms by symptom type for stats
  const symptomCounts = symptoms?.reduce((acc: Record<string, number>, symptom) => {
    acc[symptom.symptomType] = (acc[symptom.symptomType] || 0) + 1;
    return acc;
  }, {});

  const mostCommon = Object.entries(symptomCounts || {})
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: '#F5F5F5' }}>
      <DashboardHeader title="Symptom Logger" />
      
      <main className="max-w-screen-xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Log Section */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            Quick Log
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {SYMPTOM_TYPES.slice(0, 6).map((type) => (
              <button
                key={type.value}
                onClick={() => handleQuickLog(type.value, 'mild')}
                className="p-3 rounded-lg border-2 border-gray-200 hover:border-opacity-50 transition-all flex flex-col items-center gap-1"
                style={{ borderColor: '#DBDBDB' }}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-xs font-medium" style={{ color: '#3F0F22' }}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Log Button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-4 rounded-xl text-white font-medium shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
          style={{ backgroundColor: '#AF4B6C' }}
        >
          <Plus className="w-5 h-5" />
          Add Detailed Log
        </button>

        {/* Stats */}
        {symptoms?.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="text-sm font-medium text-gray-600">Total Logs</span>
              </div>
              <div className="text-3xl font-bold" style={{ color: '#3F0F22' }}>
                {symptoms?.length || 0}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" style={{ color: '#AF4B6C' }} />
                <span className="text-sm font-medium text-gray-600">Most Common</span>
              </div>
              <div className="text-lg font-bold capitalize" style={{ color: '#3F0F22' }}>
                {mostCommon?.[0] || 'None'}
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl p-5 shadow-md">
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#3F0F22' }}>
            Recent Symptoms
          </h3>

          {symptoms?.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: '#AF4B6C' }} />
              <p className="text-gray-500">No symptoms logged yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Track any discomfort or symptoms you experience
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {symptoms?.map((symptom) => {
                const typeData = SYMPTOM_TYPES.find(t => t.value === symptom.symptomType);
                const severityData = SEVERITY_LEVELS.find(s => s.value === symptom.severity);

                return (
                  <div
                    key={symptom.id}
                    className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{typeData?.icon}</span>
                        <div>
                          <h4 className="font-semibold capitalize" style={{ color: '#3F0F22' }}>
                            {symptom.symptomType}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {formatDate(symptom.date)} at {formatTime(symptom.date)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSymptom(symptom.id)}
                        className="p-1 hover:bg-red-50 rounded transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Severity:</span>
                      <span
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: severityData?.color }}
                      >
                        {symptom.severity}
                      </span>
                    </div>

                    {symptom.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        "{symptom.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Detailed Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-slide-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: '#3F0F22' }}>
                Log Symptom
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6" style={{ color: '#3F0F22' }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Symptom Type */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  Symptom Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SYMPTOM_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedType === type.value ? 'border-opacity-100' : 'border-gray-200'
                      }`}
                      style={{
                        borderColor: selectedType === type.value ? '#AF4B6C' : undefined,
                        backgroundColor: selectedType === type.value ? '#FFF5F8' : 'white',
                      }}
                    >
                      <span className="text-xl">{type.icon}</span>
                      <p className="text-xs font-medium mt-1" style={{ color: '#3F0F22' }}>
                        {type.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  Severity Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {SEVERITY_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setSelectedSeverity(level.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedSeverity === level.value ? 'border-opacity-100' : 'border-gray-200'
                      }`}
                      style={{
                        borderColor: selectedSeverity === level.value ? level.color : undefined,
                        backgroundColor: selectedSeverity === level.value ? `${level.color}20` : 'white',
                      }}
                    >
                      <p className="font-medium text-sm" style={{ color: '#3F0F22' }}>
                        {level.label}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#3F0F22' }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 resize-none"
                  
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-lg border-2 font-medium"
                style={{ borderColor: '#AF4B6C', color: '#AF4B6C' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDetailedLog}
                disabled={saving}
                className="flex-1 py-3 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: '#AF4B6C' }}
              >
                {saving ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
