// src/hooks/useTimerStateMachine.js
// State Machine for handling device position + mode logic

import { useState, useCallback, useRef } from 'react';

export function useTimerStateMachine() {
  const [mode, setMode] = useState('timer'); // 'timer' or 'focus'
  const [timerState, setTimerState] = useState('idle'); // idle, running, paused, completed
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [planDurationMinutes, setPlanDurationMinutes] = useState(25); // default 25 for timer mode
  
  const timerIntervalRef = useRef(null);
  const overtimeStartRef = useRef(null); // Track when overtime started in focus mode

  // Get the target duration for the current mode
  const getTargetDuration = useCallback((taskDuration = null) => {
    if (mode === 'timer') {
      return 25 * 60; // 25 minutes in seconds
    } else {
      // Focus mode uses task duration
      return (taskDuration || planDurationMinutes) * 60;
    }
  }, [mode, planDurationMinutes]);

  // Start the timer
  const startTimer = useCallback((taskDuration = null) => {
    const targetDuration = getTargetDuration(taskDuration);
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    setTimerState('running');
    setElapsedSeconds(0);

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [getTargetDuration]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerState('paused');
  }, []);

  // Resume the timer
  const resumeTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setTimerState('running');

    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, []);

  // Complete the timer
  const completeTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerState('completed');
  }, []);

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimerState('idle');
    setElapsedSeconds(0);
    overtimeStartRef.current = null;
  }, []);

  // Check if time has exceeded target (for focus mode overtime tracking)
  const isOvertime = useCallback((taskDuration = null) => {
    const targetDuration = getTargetDuration(taskDuration);
    return elapsedSeconds >= targetDuration;
  }, [elapsedSeconds, getTargetDuration]);

  // Get overtime duration
  const getOvertimeSeconds = useCallback((taskDuration = null) => {
    const targetDuration = getTargetDuration(taskDuration);
    if (elapsedSeconds <= targetDuration) {
      return 0;
    }
    return elapsedSeconds - targetDuration;
  }, [elapsedSeconds, getTargetDuration]);

  // State machine logic: Handle position changes based on current state and mode
  const handlePositionChange = useCallback((position, taskDuration = null) => {
    if (!position) return null;

    if (mode === 'timer') {
      // TIMER MODE LOGIC
      switch (position) {
        case 'A':
          // Position A: Start/Resume 25-minute timer
          if (timerState === 'idle' || timerState === 'completed') {
            startTimer(taskDuration);
            return 'action:start_timer';
          } else if (timerState === 'paused') {
            resumeTimer();
            return 'action:resume_timer';
          }
          break;

        case 'B':
          // Position B: Complete the timer
          if (timerState === 'running' || timerState === 'paused') {
            completeTimer();
            return 'action:complete_timer';
          }
          break;

        case 'C':
          // Position C: Pause the timer
          if (timerState === 'running') {
            pauseTimer();
            return 'action:pause_timer';
          }
          break;

        default:
          return null;
      }
    } else {
      // FOCUS MODE LOGIC
      switch (position) {
        case 'A':
          // Position A: Start/Resume background timer
          if (timerState === 'idle' || timerState === 'completed') {
            startTimer(taskDuration);
            overtimeStartRef.current = null; // Reset overtime tracking
            return 'action:start_background_timer';
          } else if (timerState === 'paused') {
            resumeTimer();
            return 'action:resume_background_timer';
          }
          break;

        case 'B':
          // Position B: Complete and save (with overtime if applicable)
          if (timerState === 'running' || timerState === 'paused') {
            completeTimer();
            const overtime = getOvertimeSeconds(taskDuration);
            return {
              action: 'action:complete_with_overtime',
              actualDurationSeconds: elapsedSeconds,
              overtimeSeconds: overtime
            };
          }
          break;

        case 'C':
          // Position C: Pause the timer
          if (timerState === 'running') {
            pauseTimer();
            return 'action:pause_background_timer';
          }
          break;

        default:
          return null;
      }
    }
  }, [mode, timerState, startTimer, resumeTimer, pauseTimer, completeTimer, getOvertimeSeconds, elapsedSeconds]);

  // Format elapsed time as MM:SS
  const formatElapsedTime = (seconds = elapsedSeconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format remaining time as MM:SS
  const formatRemainingTime = (taskDuration = null) => {
    const targetDuration = getTargetDuration(taskDuration);
    const remaining = Math.max(0, targetDuration - elapsedSeconds);
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get progress percentage
  const getProgressPercentage = useCallback((taskDuration = null) => {
    const targetDuration = getTargetDuration(taskDuration);
    return Math.min(100, (elapsedSeconds / targetDuration) * 100);
  }, [elapsedSeconds, getTargetDuration]);

  return {
    // State
    mode,
    timerState,
    elapsedSeconds,
    planDurationMinutes,

    // Setters
    setMode,
    setPlanDurationMinutes,

    // Actions
    startTimer,
    pauseTimer,
    resumeTimer,
    completeTimer,
    resetTimer,
    handlePositionChange,

    // Queries
    isOvertime,
    getOvertimeSeconds,
    getTargetDuration,
    getProgressPercentage,
    formatElapsedTime,
    formatRemainingTime,
  };
}
