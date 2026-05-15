import React, { useState, useEffect } from 'react';
import './NotesModal.css';

export default function NotesModal({ todo, onClose, onSave, isLoading = false }) {
  const [notes, setNotes] = useState(todo?.notes || '');
  const [isEditing, setIsEditing] = useState(!todo?.notes);

  useEffect(() => {
    setNotes(todo?.notes || '');
    setIsEditing(!todo?.notes);
  }, [todo]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await onSave(notes);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  return (
    <div className="notes-modal-overlay" onClick={onClose}>
      <div className="notes-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notes-modal-header">
          <h2>Notes for {todo?.task || 'Task'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="notes-form">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add your notes here..."
              className="notes-textarea"
              rows={8}
              autoFocus
            />
            <div className="notes-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setNotes(todo?.notes || '');
                  setIsEditing(false);
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="notes-display">
            <div className="notes-content">
              {notes ? (
                <p>{notes}</p>
              ) : (
                <p className="no-notes">No notes yet</p>
              )}
            </div>
            <button
              className="btn-edit"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
            >
              Edit Notes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
