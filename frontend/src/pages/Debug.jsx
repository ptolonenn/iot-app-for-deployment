import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { useHourglassWebSocket } from '../hooks/useHourglassWebSocket';
import { useTimerStateMachine } from '../hooks/useTimerStateMachine';
import './Debug.css';

export default function Debug() {
  const navigate = useNavigate();
  const [refreshCount, setRefreshCount] = useState(0);
  
  const hourglass = useHourglassWebSocket();
  const stateMachine = useTimerStateMachine();

  // Trigger re-render on position changes
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(c => c + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  const getPositionName = (pos) => {
    switch(pos) {
      case 'A': return 'Upright (Position A)';
      case 'B': return 'Flipped (Position B)';
      case 'C': return 'Horizontal (Position C)';
      default: return 'Unknown/No Position';
    }
  };

  const getConnectionColor = (status) => {
    switch(status) {
      case 'connected': return '#27ae60';
      case 'connecting': return '#f39c12';
      case 'error': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getTimerStateColor = (state) => {
    switch(state) {
      case 'running': return '#3498db';
      case 'paused': return '#f39c12';
      case 'completed': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="debug-container">
      <div className="debug-header">
        <h1>🔧 Debug Dashboard</h1>
        <p className="debug-subtitle">Real-time system state monitoring</p>
      </div>

      <div className="debug-grid">
        {/* WebSocket Status */}
        <div className="debug-card">
          <h2>📡 WebSocket Connection</h2>
          <div className="debug-status">
            <div className="status-indicator" style={{ backgroundColor: getConnectionColor(hourglass.connectionStatus) }}></div>
            <span className="status-text">{hourglass.connectionStatus}</span>
          </div>
          {hourglass.subscribedDevice && (
            <div className="debug-info">
              <div className="info-row">
                <span className="info-label">Device:</span>
                <span className="info-value">{hourglass.subscribedDevice.slice(0, 12)}...</span>
              </div>
            </div>
          )}
          {!hourglass.subscribedDevice && (
            <div className="debug-info" style={{ color: '#e74c3c' }}>
              <span className="info-label">⚠️ No device subscribed</span>
            </div>
          )}
        </div>

        {/* Device Position */}
        <div className="debug-card">
          <h2>📍 Device Position</h2>
          <div className="position-display">
            <div className="position-indicator">
              {hourglass.devicePosition ? (
                <>
                  <div className="position-emoji">
                    {hourglass.devicePosition === 'A' && '⬆️'}
                    {hourglass.devicePosition === 'B' && '⬇️'}
                    {hourglass.devicePosition === 'C' && '➡️'}
                  </div>
                  <div className="position-text">{getPositionName(hourglass.devicePosition)}</div>
                </>
              ) : (
                <div className="position-text">No position detected</div>
              )}
            </div>
          </div>
          {hourglass.lastSensorData && (
            <div className="debug-info sensor-data">
              <h3>Accelerometer Data</h3>
              <div className="sensor-axes">
                <div className="axis">
                  <span>X: {hourglass.lastSensorData.accel.x.toFixed(2)}g</span>
                </div>
                <div className="axis">
                  <span>Y: {hourglass.lastSensorData.accel.y.toFixed(2)}g</span>
                </div>
                <div className="axis">
                  <span>Z: {hourglass.lastSensorData.accel.z.toFixed(2)}g</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timer State Machine */}
        <div className="debug-card">
          <h2>⏱️ Timer State Machine</h2>
          <div className="debug-info">
            <div className="info-row">
              <span className="info-label">Mode:</span>
              <span className="info-value mode-badge" style={{
                backgroundColor: stateMachine.mode === 'timer' ? '#3498db' : '#9f7aea'
              }}>
                {stateMachine.mode.toUpperCase()}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">State:</span>
              <span className="info-value state-badge" style={{
                backgroundColor: getTimerStateColor(stateMachine.timerState)
              }}>
                {stateMachine.timerState}
              </span>
            </div>
            {stateMachine.mode === 'focus' && (
              <div className="info-row">
                <span className="info-label">Planned Duration:</span>
                <span className="info-value">{stateMachine.planDurationMinutes} min</span>
              </div>
            )}
          </div>
        </div>

        {/* Timer Display */}
        <div className="debug-card timer-card">
          <h2>⏰ Timer Display</h2>
          <div className="timer-big">
            {stateMachine.formatElapsedTime()}
          </div>
          <div className="debug-info">
            <div className="info-row">
              <span className="info-label">Elapsed:</span>
              <span className="info-value">{Math.floor(stateMachine.elapsedSeconds / 60)}m {stateMachine.elapsedSeconds % 60}s</span>
            </div>
            {stateMachine.timerState === 'running' && (
              <div className="info-row">
                <span className="info-label">Remaining:</span>
                <span className="info-value">{stateMachine.formatRemainingTime()}</span>
              </div>
            )}
            {stateMachine.isOvertime() && (
              <div className="info-row overtime">
                <span className="info-label">⏱️ OVERTIME:</span>
                <span className="info-value">+{Math.floor(stateMachine.getOvertimeSeconds() / 60)}m</span>
              </div>
            )}
          </div>
        </div>

        {/* Available Devices */}
        <div className="debug-card">
          <h2>🎮 Available Devices</h2>
          {hourglass.availableDevices.length > 0 ? (
            <div className="devices-list">
              {hourglass.availableDevices.map((device, idx) => (
                <div key={device.uuid || idx} className="device-item">
                  <span className="device-name">{device.name || device.uuid || device.id}</span>
                  <span className="device-uuid">{(device.uuid || device.id).slice(0, 12)}...</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-devices">
              <p>No devices found</p>
              <button onClick={hourglass.fetchDevices} className="refresh-btn">
                Scan Devices
              </button>
            </div>
          )}
        </div>

        {/* System Info */}
        <div className="debug-card">
          <h2>ℹ️ System Info</h2>
          <div className="debug-info">
            <div className="info-row">
              <span className="info-label">App Status:</span>
              <span className="info-value">Ready</span>
            </div>
            <div className="info-row">
              <span className="info-label">Refresh Count:</span>
              <span className="info-value">{refreshCount}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Timestamp:</span>
              <span className="info-value small">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Raw Data Section */}
      <div className="debug-raw">
        <h2>📊 Raw System State</h2>
        <div className="json-display">
          <pre>{JSON.stringify({
            hourglass: {
              connectionStatus: hourglass.connectionStatus,
              devicePosition: hourglass.devicePosition,
              subscribedDevice: hourglass.subscribedDevice ? hourglass.subscribedDevice.slice(0, 20) + '...' : null,
              availableDevicesCount: hourglass.availableDevices.length
            },
            stateMachine: {
              mode: stateMachine.mode,
              timerState: stateMachine.timerState,
              elapsedSeconds: stateMachine.elapsedSeconds,
              planDurationMinutes: stateMachine.planDurationMinutes,
              isOvertime: stateMachine.isOvertime()
            },
            lastSensorData: hourglass.lastSensorData ? {
              accel: hourglass.lastSensorData.accel,
              hasMag: hourglass.lastSensorData.hasMag
            } : null
          }, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
