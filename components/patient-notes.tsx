
'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Edit, Trash2, X } from 'lucide-react';

interface Note {
  id: string;
  noteType: string;
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  doctor: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
  };
}

interface PatientNotesProps {
  patientId: string;
  canEdit?: boolean;
}

export function PatientNotes({ patientId, canEdit = true }: PatientNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    noteType: 'general',
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchNotes();
    fetchCurrentUser();
  }, [patientId]);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setCurrentUserId(data?.user?.id || null);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await fetch(`/api/doctor/notes?patientId=${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    try {
      const url = editingNote ? '/api/doctor/notes' : '/api/doctor/notes';
      const method = editingNote ? 'PUT' : 'POST';
      const body = editingNote
        ? { noteId: editingNote.id, ...formData }
        : { patientId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setShowModal(false);
        setEditingNote(null);
        setFormData({ noteType: 'general', title: '', content: '' });
        fetchNotes();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to save note');
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      alert('Failed to save note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/doctor/notes?noteId=${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchNotes();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setFormData({
      noteType: note.noteType,
      title: note.title || '',
      content: note.content,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setFormData({ noteType: 'general', title: '', content: '' });
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'treatment':
        return 'bg-blue-100 text-blue-700';
      case 'clinical':
        return 'bg-purple-100 text-purple-700';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-5 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6" style={{ color: '#AF4B6C' }} />
            <h3 className="text-lg font-semibold" style={{ color: '#3F0F22' }}>
              Clinical Notes ({notes.length})
            </h3>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowModal(true)}
              className="p-2 rounded-lg text-white"
              style={{ backgroundColor: '#AF4B6C' }}
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No notes yet</p>
          ) : (
            notes.map((note) => {
              const canEditNote = canEdit && currentUserId === note.doctor.id;
              const isAdminNote = note.doctor.role === 'admin';
              
              return (
                <div key={note.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-full ${getNoteTypeColor(note.noteType)}`}>
                        {note.noteType}
                      </span>
                      {isAdminNote && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                          Admin
                        </span>
                      )}
                      {note.title && (
                        <span className="font-medium" style={{ color: '#3F0F22' }}>
                          {note.title}
                        </span>
                      )}
                    </div>
                    {canEditNote && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditNote(note)}
                          className="p-1 hover:bg-gray-200 rounded transition-all"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 hover:bg-red-100 rounded transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2 whitespace-pre-wrap">{note.content}</p>
                  <div className="text-xs text-gray-500">
                    <p>By: {note.doctor.fullName} {isAdminNote ? '(Administrator)' : ''}</p>
                    <p>{new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Note Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#3F0F22' }}>
                {editingNote ? 'Edit Note' : 'Add Note'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3F0F22' }}>
                  Note Type
                </label>
                <select
                  value={formData.noteType}
                  onChange={(e) => setFormData({ ...formData, noteType: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#AF4B6C]"
                >
                  <option value="general">General</option>
                  <option value="treatment">Treatment</option>
                  <option value="clinical">Clinical</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3F0F22' }}>
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#AF4B6C]"
                  placeholder="Note title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#3F0F22' }}>
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 min-h-[120px] focus:ring-2 focus:ring-[#AF4B6C]"
                  placeholder="Write your note here..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 rounded-lg border border-gray-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="flex-1 py-3 rounded-lg text-white font-medium"
                style={{ backgroundColor: '#AF4B6C' }}
                disabled={!formData.content}
              >
                {editingNote ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
