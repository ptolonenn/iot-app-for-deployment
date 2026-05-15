# IoT Hourglass App - Features Implementation Guide

## Overview
This implementation provides a complete state machine-based timer system with mode selection, analytics tracking, ESP32 device communication, and task notes functionality.

## 🎯 Features Implemented

### 1. **State Machine** (`useTimerStateMachine.js`)
Handles mode-based logic for device positions:

#### Timer Mode (25 minutes)
- **Position A (Upright)**: Start/Resume 25-minute timer
- **Position B (Flipped)**: Complete timer
- **Position C (Horizontal)**: Pause timer

#### Focus Mode (Custom Duration)
- **Position A (Upright)**: Start/Resume background timer
- **Position B (Flipped)**: Complete with overtime tracking
- **Position C (Horizontal)**: Pause timer
- Tracks overtime when actual time exceeds planned duration

### 2. **Timer & Analytics Engine** (`useTimerAnalytics.js`)
Tracks time and saves session data:

```javascript
// Save completed session
await analytics.saveSessionCompletion(
  todoId,
  actualDurationSeconds,
  mode,        // 'timer' or 'focus'
  notes,
  { planDurationMinutes: 25 }
);
```

**Saves to Database:**
- `time_actual_duration` - Minutes actually spent
- `time_completed_at` - When task was completed
- `notes` - User notes
- `mode` - Which mode was used

**Analytics Queries:**
```javascript
// Get stats for last 7 days
const stats = analytics.getSessionStats(todos, 7);
// Returns: { totalSessions, totalMinutes, avgMinutes, modeBreakdown }

// Calculate analytics for a task
const analysis = analytics.calculateAnalytics(completedTodo);
// Returns: planned, actual, difference, percentageVariance, isOvertime
```

### 3. **ESP32 Return Payload** (Enhanced `useHourglassWebSocket.js`)
Send commands back to ESP32 hourglass:

```javascript
// Send START_SAND command with duration
startSand(45);  // Sends: {"command": "START_SAND", "duration_minutes": 45}

// Pause the sand (stop timer)
stopSand();     // Sends: {"command": "STOP_SAND"}

// Reset hourglass
resetSand();    // Sends: {"command": "RESET"}
```

**Automatic Command Flow:**
- When timer starts → Sends `START_SAND` with duration
- When timer pauses → Sends `STOP_SAND`
- When position A detected → Triggers timer start (sends command)

### 4. **Notes Modal** (`NotesModal.jsx` + `NotesModal.css`)
Add/edit task notes with a beautiful modal interface:

```javascript
// Open notes modal
<NotesModal
  todo={currentTask}
  onClose={() => setShowNotesModal(false)}
  onSave={handleSaveNotes}
  isLoading={isLoading}
/>
```

**Features:**
- Display existing notes
- Edit notes with textarea
- Save to database
- Auto-save functionality

### 5. **Updated NowPlaying Component**
Integrated all features with:
- Mode selector (Timer/Focus with custom duration)
- Real-time progress bar
- Overtime detection with visual alert
- Remaining time display
- Notes button
- Automatic ESP32 command sending
- Hardware position indicators

## 📊 Database Schema Updates

New columns added to `todos` table:

```sql
-- Notes for the task
notes TEXT

-- Tracking which mode was used
mode TEXT DEFAULT 'timer'

-- Actual time spent in minutes
time_actual_duration INTEGER

-- When the task was completed
time_completed_at DATETIME
```

## 🚀 Backend API Endpoints

### Update Todo (with analytics)
```
PUT /api/todos/:id
{
  "task": "string",
  "completed": boolean,
  "duration": integer,
  "due_date": datetime,
  "notes": string,
  "mode": "timer" | "focus",
  "time_actual_duration": integer (minutes),
  "time_completed_at": datetime
}
```

### Get Analytics
```
GET /api/todos/analytics/summary?days=7

Response:
{
  "totalSessions": 5,
  "totalMinutes": 245,
  "avgMinutes": 49,
  "modeBreakdown": { "timer": 3, "focus": 2 },
  "sessions": [...]
}
```

## 🔌 WebSocket Command Protocol

**Commands sent to ESP32:**

```json
{
  "type": "actuator_cmd",
  "actuator": "hourglass",
  "command": "START_SAND",
  "device": "device_uuid",
  "duration_minutes": 45
}
```

**Available Commands:**
- `START_SAND` - Start timer with duration
- `STOP_SAND` - Pause the timer
- `RESET` - Reset to 0

## 💾 Saving Workflow

### When User Completes a Task:

1. **State Machine** detects Position B (Flipped) or user clicks Complete
2. **Timer stops** and calculates elapsed seconds
3. **Analytics saves** the session:
   ```javascript
   saveSessionCompletion(
     todoId,
     elapsedSeconds,
     mode,
     notes,
     { planDurationMinutes }
   )
   ```
4. **Database updates** with all analytics fields
5. **UI resets** for next task

### What Gets Saved:
- ✅ Actual duration spent
- ✅ Completion timestamp
- ✅ Selected mode (timer/focus)
- ✅ User notes
- ✅ Overtime information (calculated from plan vs actual)

## 📱 Mode Selection Flow

**Timer Mode (25 min Fixed):**
```
Mode: Timer → Start → 25-minute countdown → Position B → Save
```

**Focus Mode (Custom Duration):**
```
Mode: Focus → Set duration (e.g., 45 min) → Start → 
Can run longer → Position B → Save with overtime
```

## ⏱️ Time Formatting Utilities

```javascript
// Format elapsed time MM:SS
stateMachine.formatElapsedTime();      // "25:30"

// Format remaining time
stateMachine.formatRemainingTime(duration);  // "10:45"

// Get progress percentage
stateMachine.getProgressPercentage(duration); // 65

// Check for overtime
if (stateMachine.isOvertime(duration)) {
  const overtime = stateMachine.getOvertimeSeconds(duration);
}
```

## 🔄 Hardware Integration

**Position Detection → State Machine → Action:**

```
Position A (Upright) → handlePositionChange('A')
  ↓
In Timer Mode? → Start 25-min timer
In Focus Mode? → Start custom timer
  ↓
Send START_SAND command to ESP32
  ↓
Update UI (timer running, progress bar, etc.)

---

Position B (Flipped) → handlePositionChange('B')
  ↓
Complete timer & save to database
  ↓
Send completion data with analytics
  ↓
Show next task

---

Position C (Horizontal) → handlePositionChange('C')
  ↓
Pause timer
  ↓
Send STOP_SAND command to ESP32
```

## 📈 Analytics Features

### Session Statistics
```javascript
const stats = analytics.getSessionStats(allTodos, 7);
// {
//   totalSessions: 5,
//   totalMinutes: 245,
//   avgMinutes: 49,
//   modeBreakdown: { timer: 3, focus: 2 },
//   periodStart, periodEnd
// }
```

### Task Analytics
```javascript
const analysis = analytics.calculateAnalytics(completedTodo);
// {
//   plannedMinutes: 25,
//   actualMinutes: 28,
//   difference: 3,
//   percentageVariance: 12,
//   isOvertime: true,
//   mode: 'timer',
//   notes: 'User notes...'
// }
```

## 🎨 UI Components

### Mode Selector
- Dropdown: Timer / Focus
- Input field: Custom duration (shows for Focus mode)
- Real-time updates to timer logic

### Timer Display
- Status icon (▶ ⏸ ✓ ⏹)
- Large monospace time display
- Progress bar (animated)
- Remaining time counter
- Overtime alert (with pulsing animation)

### Control Buttons
- **Start/Resume**: Begins timer or resumes paused timer
- **Pause**: Pauses running timer
- **Complete**: Ends session and saves to database

### Notes Button
- Opens modal when clicked
- Displays existing notes
- Allows editing and saving
- Visual indicator if notes exist

## 🧪 Testing the Implementation

1. **Test State Machine:**
   ```javascript
   // Use Chrome DevTools Console
   const sm = useTimerStateMachine();
   sm.setMode('focus');
   sm.setPlanDurationMinutes(45);
   sm.startTimer(45);
   ```

2. **Test ESP32 Commands:**
   - Select device in NowPlaying
   - Click Start → Check WebSocket sends START_SAND
   - Click Pause → Check WebSocket sends STOP_SAND

3. **Test Analytics:**
   - Complete a task
   - Check database: `SELECT * FROM todos WHERE id = X`
   - Verify fields: time_actual_duration, time_completed_at, notes, mode

4. **Test Notes Modal:**
   - Click "Add Notes" button
   - Enter text
   - Save → Verify in database and UI

## 📝 Configuration

**Timer Mode Duration:** 25 minutes (hardcoded in state machine)

**Focus Mode Duration:** User selectable, 1-120 minutes

**Analytics Lookback:** Default 7 days, configurable

**WebSocket URL:** `${VITE_WS_URL}` environment variable

## 🔐 Data Security

- All endpoints require authentication (`authenticateToken` middleware)
- Users can only access their own todos
- Notes stored as TEXT in database
- Time data immutable after completion

## 🚀 Performance Notes

- Timer updates every 1 second (efficient interval management)
- State machine uses React hooks (no unnecessary re-renders)
- Progress bar uses CSS transitions (smooth 60fps)
- WebSocket commands are debounced
- Database queries indexed by user_id

---

**Status:** ✅ All features implemented and ready for testing!
