// src/hooks/useTimerAnalytics.js
// Analytics engine: tracks time, saves to database, handles overtime logic

import { useState, useCallback, useRef, useEffect } from 'react';
import { updateTodo } from '../lib/todos';

export function useTimerAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastSavedSession, setLastSavedSession] = useState(null);

  // Save completion data to database
  const saveSessionCompletion = useCallback(async (
    todoId,
    actualDurationSeconds,
    mode = 'timer',
    notes = '',
    modeConfig = {}
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const actualDurationMinutes = Math.round(actualDurationSeconds / 60);
      const completedAt = new Date().toISOString();

      // Calculate overtime if in focus mode
      let overtimeMinutes = 0;
      if (mode === 'focus' && modeConfig.planDurationMinutes) {
        const planSeconds = modeConfig.planDurationMinutes * 60;
        if (actualDurationSeconds > planSeconds) {
          overtimeMinutes = Math.round((actualDurationSeconds - planSeconds) / 60);
        }
      }

      // Prepare the update payload
      const updatePayload = {
        completed: 1,
        time_actual_duration: actualDurationMinutes,
        time_completed_at: completedAt,
        notes: notes || null,
        mode: mode
      };

      // Save to database
      const result = await updateTodo(todoId, updatePayload);

      // Track the session
      const session = {
        todoId,
        actualDurationMinutes,
        completedAt,
        mode,
        overtimeMinutes,
        notes,
        timestamp: new Date()
      };

      setLastSavedSession(session);

      console.log('✅ Session saved:', session);
      return session;
    } catch (err) {
      console.error('❌ Failed to save session:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save notes for a todo
  const saveNotes = useCallback(async (todoId, notes) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateTodo(todoId, { notes });
      console.log('✅ Notes saved:', notes);
      return result;
    } catch (err) {
      console.error('❌ Failed to save notes:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate analytics for a completed todo
  const calculateAnalytics = useCallback((todo) => {
    if (!todo.time_actual_duration) {
      return null;
    }

    const plannedMinutes = todo.duration || 0;
    const actualMinutes = todo.time_actual_duration;
    const difference = actualMinutes - plannedMinutes;
    const percentageVariance = plannedMinutes > 0 ? (difference / plannedMinutes) * 100 : 0;

    return {
      plannedMinutes,
      actualMinutes,
      difference,
      percentageVariance,
      isOvertime: difference > 0,
      completedAt: todo.time_completed_at,
      mode: todo.mode,
      notes: todo.notes
    };
  }, []);

  // Format analytics for display
  const formatAnalytics = (analytics) => {
    if (!analytics) return null;

    return {
      ...analytics,
      plannedDisplay: `${analytics.plannedMinutes}m`,
      actualDisplay: `${analytics.actualMinutes}m`,
      differenceDisplay: `${analytics.difference > 0 ? '+' : ''}${analytics.difference}m`,
      varianceDisplay: `${analytics.percentageVariance > 0 ? '+' : ''}${analytics.percentageVariance.toFixed(1)}%`
    };
  };

  // Get session statistics for a period
  const getSessionStats = useCallback((todos, daysBack = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const completedSessions = todos.filter(
      todo => todo.completed && 
               todo.time_completed_at && 
               new Date(todo.time_completed_at) >= cutoffDate
    );

    if (completedSessions.length === 0) {
      return null;
    }

    const totalMinutes = completedSessions.reduce(
      (sum, todo) => sum + (todo.time_actual_duration || 0),
      0
    );

    const avgMinutes = Math.round(totalMinutes / completedSessions.length);

    const modeBreakdown = completedSessions.reduce((acc, todo) => {
      const mode = todo.mode || 'unknown';
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {});

    return {
      totalSessions: completedSessions.length,
      totalMinutes,
      avgMinutes,
      modeBreakdown,
      daysBack,
      periodEnd: new Date(),
      periodStart: cutoffDate
    };
  }, []);

  return {
    isLoading,
    error,
    lastSavedSession,
    saveSessionCompletion,
    saveNotes,
    calculateAnalytics,
    formatAnalytics,
    getSessionStats,
  };
}
