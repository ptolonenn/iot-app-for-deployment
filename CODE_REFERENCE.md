# Code Reference - Using the New Hooks & Features

## Import Statements

```javascript
// In any component that needs these features:
import { useTimerStateMachine } from '../hooks/useTimerStateMachine';
import { useTimerAnalytics } from '../hooks/useTimerAnalytics';
import NotesModal from '../components/NotesModal';
```

---

## useTimerStateMachine - Complete API

### Initialize
```javascript
const stateMachine = useTimerStateMachine();
```

### Get Current State
```javascript
stateMachine.timerState         // 'idle', 'running', 'paused', 'completed'
stateMachine.elapsedSeconds     // Number of seconds elapsed
stateMachine.mode               // 'timer' or 'focus'
stateMachine.planDurationMinutes // Current plan duration
```

### Control Timer
```javascript
// Start timer (optionally with task duration)
stateMachine.startTimer(45);    // 45 = custom duration in minutes
stateMachine.startTimer();      // Uses mode default (25 for timer, plan value for focus)

// Pause running timer
stateMachine.pauseTimer();

// Resume paused timer
stateMachine.resumeTimer();

// Complete timer (stops it)
stateMachine.completeTimer();

// Reset everything to idle
stateMachine.resetTimer();
```

### Handle Hardware Position
```javascript
// This is what happens when device flips
const action = stateMachine.handlePositionChange('A', currentTask?.duration);
// Returns:
// - 'action:start_timer'
// - 'action:resume_timer'
// - 'action:pause_timer'
// - 'action:complete_timer'
// - { action: 'action:complete_with_overtime', actualDurationSeconds, overtimeSeconds }

if (action === 'action:complete_timer') {
  handleComplete();
}
```

### Query State
```javascript
// Check if overtime
if (stateMachine.isOvertime(currentTask?.duration)) {
  console.log('⏱️ Time exceeded!');
}

// Get overtime duration in seconds
const overtimeSeconds = stateMachine.getOvertimeSeconds(currentTask?.duration);

// Get target duration for current mode
const targetSeconds = stateMachine.getTargetDuration(currentTask?.duration);

// Get progress percentage
const progress = stateMachine.getProgressPercentage(currentTask?.duration);
// Returns 0-100
```

### Format Time
```javascript
// Format elapsed time as MM:SS
stateMachine.formatElapsedTime()           // "25:30"
stateMachine.formatElapsedTime(600)        // "10:00" (custom seconds)

// Format remaining time
stateMachine.formatRemainingTime(45)       // "34:15" (if 45 min task)

// Get progress bar width
`width: ${stateMachine.getProgressPercentage(45)}%`
```

### Change Mode
```javascript
// Switch between Timer and Focus
stateMachine.setMode('timer');   // 25 min fixed
stateMachine.setMode('focus');   // Custom duration

// Set custom duration for Focus mode
stateMachine.setPlanDurationMinutes(45);
```

---

## useTimerAnalytics - Complete API

### Initialize
```javascript
const analytics = useTimerAnalytics();
```

### Save Session
```javascript
// When task is completed, save analytics
await analytics.saveSessionCompletion(
  todoId,                    // Task ID
  actualDurationSeconds,     // 2700 (45 minutes)
  mode,                      // 'timer' or 'focus'
  notes,                     // "Completed successfully"
  { 
    planDurationMinutes: 45  // Original plan
  }
);

// Returns:
// {
//   todoId: 123,
//   actualDurationMinutes: 45,
//   completedAt: "2024-05-16T14:30:00Z",
//   mode: 'focus',
//   overtimeMinutes: 0,
//   notes: "Completed successfully"
// }
```

### Save Notes Only
```javascript
await analytics.saveNotes(todoId, "Updated notes text");
```

### Get Analytics
```javascript
// Analyze a completed task
const analysis = analytics.calculateAnalytics(completedTodo);
// Returns:
// {
//   plannedMinutes: 25,
//   actualMinutes: 28,
//   difference: 3,              // Minutes over/under
//   percentageVariance: 12,     // % over/under
//   isOvertime: true,
//   completedAt: "...",
//   mode: 'timer',
//   notes: "..."
// }

// Format for display
const formatted = analytics.formatAnalytics(analysis);
// {
//   ...analysis,
//   plannedDisplay: "25m",
//   actualDisplay: "28m",
//   differenceDisplay: "+3m",
//   varianceDisplay: "+12%"
// }
```

### Session Statistics
```javascript
// Get stats for last 7 days
const stats = analytics.getSessionStats(allTodos, 7);
// Returns:
// {
//   totalSessions: 5,
//   totalMinutes: 245,
//   avgMinutes: 49,
//   modeBreakdown: { timer: 3, focus: 2 },
//   daysBack: 7,
//   periodStart: Date,
//   periodEnd: Date
// }

// For last 30 days
const monthStats = analytics.getSessionStats(allTodos, 30);
```

### Error Handling
```javascript
// Check loading and error states
if (analytics.isLoading) {
  return <div>Saving...</div>;
}

if (analytics.error) {
  return <div>Error: {analytics.error}</div>;
}

// Access last saved session
console.log(analytics.lastSavedSession);
```

---

## useHourglassWebSocket - New Timer Methods

### Initialize (in NowPlaying)
```javascript
const {
  startSand,      // Start sand timer
  stopSand,       // Stop sand timer
  resetSand,      // Reset hourglass
  subscribedDevice
} = device;
```

### Send Commands
```javascript
// Start timer with duration
startSand(25);    // 25 minutes

// Pause the sand
stopSand();

// Reset hourglass
resetSand();

// Check if device is connected before sending
if (subscribedDevice) {
  startSand(45);
}
```

---

## NotesModal - Component Usage

### Basic Usage
```javascript
const [showNotesModal, setShowNotesModal] = useState(false);

// In JSX:
{showNotesModal && (
  <NotesModal
    todo={currentTask}
    onClose={() => setShowNotesModal(false)}
    onSave={async (notes) => {
      await analytics.saveNotes(currentTask.id, notes);
      setShowNotesModal(false);
    }}
    isLoading={analytics.isLoading}
  />
)}

// Button to open
<button onClick={() => setShowNotesModal(true)}>
  📝 Add Notes
</button>
```

### Props
```javascript
NotesModal.propTypes = {
  todo: {
    id: number,
    task: string,
    notes: string (optional)
  },
  onClose: function,           // Called when modal closes
  onSave: async function,      // Called with notes text
  isLoading: boolean           // Show loading state
}
```

---

## Complete Integration Example

### Full Workflow in NowPlaying
```javascript
import { useTimerStateMachine } from '../hooks/useTimerStateMachine';
import { useTimerAnalytics } from '../hooks/useTimerAnalytics';
import NotesModal from '../components/NotesModal';

export default function NowPlaying({ currentTask, onComplete, device }) {
  const stateMachine = useTimerStateMachine();
  const analytics = useTimerAnalytics();
  const [showNotes, setShowNotes] = useState(false);
  
  const { devicePosition, subscribedDevice, startSand } = device;

  // Handle hardware position changes
  useEffect(() => {
    if (!devicePosition) return;
    
    const action = stateMachine.handlePositionChange(
      devicePosition, 
      currentTask?.duration
    );
    
    if (action === 'action:complete_timer') {
      handleComplete();
    }
  }, [devicePosition]);

  // Send START_SAND when timer starts
  useEffect(() => {
    if (stateMachine.timerState === 'running' && subscribedDevice) {
      const duration = stateMachine.mode === 'timer' ? 25 : currentTask?.duration;
      startSand(duration);
    }
  }, [stateMachine.timerState]);

  // Handle completion
  const handleComplete = async () => {
    stateMachine.completeTimer();
    
    await analytics.saveSessionCompletion(
      currentTask.id,
      stateMachine.elapsedSeconds,
      stateMachine.mode,
      currentTask.notes || '',
      { planDurationMinutes: stateMachine.planDurationMinutes }
    );
    
    await onComplete?.();
    stateMachine.resetTimer();
  };

  const handleSaveNotes = async (notes) => {
    await analytics.saveNotes(currentTask.id, notes);
    setShowNotes(false);
  };

  return (
    <div className="now-playing">
      {/* Mode Selector */}
      <select value={stateMachine.mode} onChange={(e) => stateMachine.setMode(e.target.value)}>
        <option value="timer">Timer (25 min)</option>
        <option value="focus">Focus (Custom)</option>
      </select>

      {/* Timer Display */}
      <div className="timer-display">
        {stateMachine.formatElapsedTime()}
      </div>

      {/* Progress Bar */}
      <div className="progress" style={{
        width: `${stateMachine.getProgressPercentage(currentTask?.duration)}%`
      }} />

      {/* Overtime Alert */}
      {stateMachine.isOvertime(currentTask?.duration) && (
        <div className="overtime">
          ⏱️ Overtime: +{Math.floor(stateMachine.getOvertimeSeconds(currentTask?.duration) / 60)}m
        </div>
      )}

      {/* Controls */}
      <button onClick={() => stateMachine.startTimer(currentTask?.duration)}>
        Start
      </button>
      <button onClick={() => stateMachine.pauseTimer()}>
        Pause
      </button>
      <button onClick={handleComplete}>
        Complete
      </button>

      {/* Notes */}
      <button onClick={() => setShowNotes(true)}>
        📝 Notes
      </button>

      {/* Notes Modal */}
      {showNotes && (
        <NotesModal
          todo={currentTask}
          onClose={() => setShowNotes(false)}
          onSave={handleSaveNotes}
          isLoading={analytics.isLoading}
        />
      )}
    </div>
  );
}
```

---

## Testing Code Snippets

### Test State Machine in Console
```javascript
// In browser DevTools console on NowPlaying component

// Create state machine
const sm = useTimerStateMachine();

// Test Timer mode
sm.setMode('timer');
sm.startTimer();
// Should count up from 0

// Test Focus mode with overtime
sm.setMode('focus');
sm.setPlanDurationMinutes(1);  // 1 minute
sm.startTimer(1);
// Wait 2 minutes, then check:
sm.isOvertime(1)               // Should be true
sm.getOvertimeSeconds(1)       // Should be ~60

// Test position handling
sm.handlePositionChange('A', 25)  // Start
sm.handlePositionChange('C', 25)  // Pause
sm.handlePositionChange('B', 25)  // Complete
```

### Test Analytics in Console
```javascript
// Mock a completed todo
const completedTodo = {
  id: 1,
  task: "Test task",
  duration: 25,
  time_actual_duration: 28,
  mode: 'timer',
  notes: "Great work!"
};

// Analyze it
const analysis = analytics.calculateAnalytics(completedTodo);
console.log(analytics.formatAnalytics(analysis));

// Should show:
// {
//   plannedMinutes: 25,
//   actualMinutes: 28,
//   difference: 3,
//   percentageVariance: 12,
//   varianceDisplay: "+12%",
//   isOvertime: true,
//   ...
// }
```

---

## Common Patterns

### Auto-save on Timer Complete
```javascript
// useEffect automatically saves when timer hits target
useEffect(() => {
  if (stateMachine.timerState === 'completed') {
    analytics.saveSessionCompletion(
      currentTask.id,
      stateMachine.elapsedSeconds,
      stateMachine.mode,
      currentTask.notes
    );
  }
}, [stateMachine.timerState]);
```

### Display Time Remaining
```javascript
<div>
  {stateMachine.timerState === 'running' && (
    <p>Remaining: {stateMachine.formatRemainingTime(currentTask?.duration)}</p>
  )}
</div>
```

### Show Mode-Specific Duration
```javascript
<input
  type="number"
  value={stateMachine.planDurationMinutes}
  onChange={(e) => stateMachine.setPlanDurationMinutes(parseInt(e.target.value))}
  style={{ display: stateMachine.mode === 'focus' ? 'block' : 'none' }}
/>
```

---

**All hooks are fully type-safe and follow React best practices!**
