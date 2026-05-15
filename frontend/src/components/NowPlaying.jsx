import React, { useState, useEffect, useRef } from 'react';
import './NowPlaying.css';
import { useTimerStateMachine } from '../hooks/useTimerStateMachine';
import { useTimerAnalytics } from '../hooks/useTimerAnalytics';
import NotesModal from './NotesModal';

export default function NowPlaying({ 
  currentTask, 
  onComplete, 
  onStatusChange,
  refreshTasks,
  device
}) {
  // State machine for mode-based logic
  const stateMachine = useTimerStateMachine();
  
  // Analytics engine for tracking and saving
  const analytics = useTimerAnalytics();
  
  // UI state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const lastHandledPositionRef = useRef(null);
  const completingRef = useRef(false);
  
  const {
    connectionStatus,
    devicePosition,
    availableDevices,
    subscribedDevice,
    subscribeToDevice,
    sendLedPulse,
    fetchDevices,
    startSand,
    stopSand,
    resetSand
  } = device;

  // Reset timer when current task changes
  useEffect(() => {
    stateMachine.resetTimer();
  }, [currentTask?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // No need to manually clean up intervals since state machine handles it
    };
  }, []);

  // Handle device position changes with state machine
  useEffect(() => {
    if (!devicePosition) return;

    // Ignore repeated same position signals
    if (lastHandledPositionRef.current === devicePosition) {
      return;
    }

    lastHandledPositionRef.current = devicePosition;

    console.log(`Hardware position changed to: ${devicePosition}`);

    // Use state machine to handle the position
    const action = stateMachine.handlePositionChange(devicePosition, currentTask?.duration);
    
    if (!action) return;

    console.log('State machine action:', action);

    // Send LED pulse feedback
    sendLedPulse();

    // Update UI status
    const statusMap = {
      'action:start_timer': 'active',
      'action:start_background_timer': 'active',
      'action:resume_timer': 'active',
      'action:resume_background_timer': 'active',
      'action:pause_timer': 'paused',
      'action:pause_background_timer': 'paused',
      'action:complete_timer': 'completed',
      'action:complete_with_overtime': 'completed'
    };

    const actionType = typeof action === 'string' ? action : action.action;
    const newStatus = statusMap[actionType];
    if (newStatus) {
      onStatusChange?.(newStatus);
    }

    // If completion action, save to database
    if (actionType === 'action:complete_timer' || actionType === 'action:complete_with_overtime') {
      handleComplete();
    }

  }, [devicePosition, stateMachine, currentTask?.duration]);

  // Send command to ESP32 when timer starts
  useEffect(() => {
    if (stateMachine.timerState === 'running' && subscribedDevice && currentTask?.duration) {
      // Send START_SAND command with duration
      const durationToSend = stateMachine.mode === 'timer' ? 25 : currentTask.duration;
      startSand(durationToSend);
    }
  }, [stateMachine.timerState, subscribedDevice, currentTask, startSand, stateMachine.mode]);

  // Send stop command when timer pauses
  useEffect(() => {
    if (stateMachine.timerState === 'paused' && subscribedDevice) {
      stopSand();
    }
  }, [stateMachine.timerState, subscribedDevice, stopSand]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    switch(stateMachine.timerState) {
      case 'running': return '▶';
      case 'paused': return '⏸';
      case 'completed': return '✓';
      default: return '⏹';
    }
  };

  const getStatusText = () => {
    switch(stateMachine.timerState) {
      case 'running': return 'Active';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      default: return 'Not started';
    }
  };

  const getConnectionIcon = () => {
    switch(connectionStatus) {
      case 'connected': return '🟢';
      case 'connecting': return '🟡';
      case 'error': return '🔴';
      default: return '⚫';
    }
  };

  const handlePlay = () => {
    if (!currentTask) return;
    stateMachine.startTimer(currentTask.duration);
    onStatusChange?.('active');
    sendLedPulse();
  };

  const handlePause = () => {
    if (!currentTask) return;
    stateMachine.pauseTimer();
    onStatusChange?.('paused');
    sendLedPulse();
  };

  const handleResume = () => {
    if (!currentTask) return;
    stateMachine.resumeTimer();
    onStatusChange?.('active');
    sendLedPulse();
  };

  const handleComplete = async () => {
    if (!currentTask || completingRef.current) return;
    
    completingRef.current = true;
    try {
      stateMachine.completeTimer();
      
      // Save to database
      await analytics.saveSessionCompletion(
        currentTask.id,
        stateMachine.elapsedSeconds,
        stateMachine.mode,
        currentTask.notes || '',
        { planDurationMinutes: stateMachine.planDurationMinutes }
      );

      // Call parent callback
      await onComplete?.();
      
      // Reset for next task
      stateMachine.resetTimer();
      onStatusChange?.('completed');
    } catch (err) {
      console.error('Failed to complete task:', err);
    } finally {
      completingRef.current = false;
    }
  };

  const handleSaveNotes = async (notes) => {
    try {
      await analytics.saveNotes(currentTask.id, notes);
      setShowNotesModal(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
    }
  };

  // Device selector handler
  const handleSubscribe = (e) => {
    const deviceId = e.target.value;
    if (deviceId) {
      subscribeToDevice(deviceId);
    }
  };

  return (
    <div className="now-playing">
      <div className="now-playing-header">
        <h3>Now Playing</h3>
        <div className="connection-status" title={`WebSocket: ${connectionStatus}`}>
          {getConnectionIcon()} {connectionStatus}
        </div>
      </div>

      {/* Device selector — show when no device subscribed */}
      {!subscribedDevice && (
        <div className="device-selector">
          <h4>Connect to Hourglass</h4>
          {availableDevices.length > 0 ? (
            <>
              <select onChange={handleSubscribe} defaultValue="">
                <option value="">Select a device...</option>
                {availableDevices.map((device, idx) => (
                  <option key={device.uuid || idx} value={device.uuid || device.id}>
                    {device.name || device.uuid || device.id}
                  </option>
                ))}
              </select>
              <button onClick={fetchDevices} className="refresh-devices-btn">
                Refresh
              </button>
            </>
          ) : (
            <div className="no-devices">
              <p>No devices found</p>
              <button onClick={fetchDevices} className="refresh-devices-btn">
                Scan for devices
              </button>
              <small>Make sure your ESP32 is connected to NodeRED</small>
            </div>
          )}
        </div>
      )}

      {/* Show subscribed device info */}
      {subscribedDevice && (
        <div className="subscribed-device">
          <span className="device-indicator">📡 Connected to: </span>
          <span className="device-id">{subscribedDevice.slice(0, 8)}...</span>
        </div>
      )}

      {!currentTask ? (
        <div className="empty-message">
          <p>No active task</p>
          <p className="empty-hint">Select a task from the list to begin</p>
        </div>
      ) : (
        <>
          {/* Mode Selector */}
          <div className="mode-selector">
            <label>Mode:</label>
            <select 
              value={stateMachine.mode} 
              onChange={(e) => {
                stateMachine.setMode(e.target.value);
                lastHandledPositionRef.current = null;
              }}
            >
              <option value="timer">Timer (25 min)</option>
              <option value="focus">Focus (Custom)</option>
            </select>
            {stateMachine.mode === 'focus' && (
              <input
                type="number"
                min="1"
                max="120"
                value={stateMachine.planDurationMinutes}
                onChange={(e) => stateMachine.setPlanDurationMinutes(parseInt(e.target.value))}
                className="duration-input"
                title="Planned duration in minutes"
              />
            )}
          </div>

          <div className="current-task">
            <h2>{currentTask.task}</h2>
            {currentTask.duration && (
              <p className="task-duration">Planned: {currentTask.duration} min</p>
            )}
          </div>

          <div className="timer-section">
            <div className="timer-display">
              <span className="timer-icon">{getStatusIcon()}</span>
              <span className="timer-time">{stateMachine.formatElapsedTime()}</span>
            </div>
            {stateMachine.timerState === 'running' && (
              <div className="timer-remaining">
                Remaining: {stateMachine.formatRemainingTime(currentTask.duration)}
              </div>
            )}
            {stateMachine.isOvertime(currentTask.duration) && (
              <div className="timer-overtime">
                ⏱️ Overtime: +{Math.floor(stateMachine.getOvertimeSeconds(currentTask.duration) / 60)}m
              </div>
            )}
            <div className="timer-status">{getStatusText()}</div>
            {stateMachine.timerState === 'running' && (
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${stateMachine.getProgressPercentage(currentTask.duration)}%` }}
                />
              </div>
            )}
          </div>

          <div className="task-controls">
            {stateMachine.timerState === 'idle' || stateMachine.timerState === 'completed' ? (
              <button 
                onClick={handlePlay} 
                className="control-btn play"
              >
                Start
              </button>
            ) : stateMachine.timerState === 'running' ? (
              <>
                <button 
                  onClick={handlePause} 
                  className="control-btn pause"
                >
                  Pause
                </button>
                <button 
                  onClick={handleComplete} 
                  className="control-btn complete"
                >
                  Complete
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={handleResume} 
                  className="control-btn play"
                >
                  Resume
                </button>
                <button 
                  onClick={handleComplete} 
                  className="control-btn complete"
                >
                  Complete
                </button>
              </>
            )}
          </div>

          {/* Notes Button */}
          <div className="task-actions">
            <button
              className="btn-notes"
              onClick={() => setShowNotesModal(true)}
              title="Add notes for this task"
            >
              📝 {currentTask.notes ? 'Edit Notes' : 'Add Notes'}
            </button>
          </div>
          
          <div className="device-mapping">
            <small>Device mapping: Start (A) | Pause (C) | Complete (B)</small>
          </div>

          {/* Show current position from hardware */}
          {devicePosition && (
            <div className="current-position">
              <small>Hardware position: {
                devicePosition === 'A' ? 'Upright (Start)' :
                devicePosition === 'B' ? 'Flipped (Complete)' :
                'Horizontal (Pause)'
              }</small>
            </div>
          )}

          {/* Notes Modal */}
          {showNotesModal && (
            <NotesModal
              todo={currentTask}
              onClose={() => setShowNotesModal(false)}
              onSave={handleSaveNotes}
              isLoading={analytics.isLoading}
            />
          )}
        </>
      )}
    </div>
  );
}