# Architecture Overview - State Machine & Analytics System

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    IoT Hourglass WebApp                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│    Hardware (ESP32)          │
│  - IMU Sensor                │
│  - Sand Mechanism            │
│  - Position Detection        │
└──────────────┬───────────────┘
               │ WebSocket
               │ (Position Data)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│              useHourglassWebSocket Hook                          │
│  - Receives: Position A, B, C                                    │
│  - Sends: START_SAND, STOP_SAND, RESET commands                │
└──────────────┬──────────────────────────────────────────────────┘
               │
               │ Position Update
               ▼
┌──────────────────────────────────────────────────────────────────┐
│           NowPlaying Component                                   │
│  - Displays current task                                        │
│  - Mode selector (Timer/Focus)                                  │
│  - Timer display & controls                                     │
│  - Notes button                                                  │
└──┬───────────────────────────────────────────────────────────────┘
   │
   ├──────────────────────────────┬──────────────────────────────┐
   │                              │                              │
   ▼                              ▼                              ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌─────────────────────┐
│ useTimerStateMachine │  │ useTimerAnalytics    │  │ NotesModal          │
│                      │  │                      │  │                     │
│ - Mode logic         │  │ - Time tracking      │  │ - Add/edit notes    │
│ - Position handling  │  │ - Database saving    │  │ - Modal UI          │
│ - Time formatting    │  │ - Statistics calc    │  │ - Save to DB        │
│ - Overtime detection │  │ - Analytics queries  │  │                     │
└──┬───────────────────┘  └──────────┬───────────┘  └─────────────────────┘
   │                                  │
   │ handlePositionChange()           │ saveSessionCompletion()
   │ - Determines next state          │ saveNotes()
   │ - Returns action                 │ calculateAnalytics()
   │                                  │
   └──────────────┬───────────────────┘
                  │
                  ▼
         ┌──────────────────┐
         │ Database (SQLite)│
         │                  │
         │ todos table:     │
         │ - time_actual_   │
         │   duration       │
         │ - time_completed │
         │   _at            │
         │ - notes          │
         │ - mode           │
         └──────────────────┘

               │
               ▼
        ┌──────────────────┐
        │ Backend API      │
        │                  │
        │ PUT /todos/:id   │ Update with analytics
        │ GET /analytics/  │ Query statistics
        │   summary        │
        └──────────────────┘
```

---

## Data Flow - Complete Task Workflow

### Step 1: User Selects Task
```
User clicks task in list
  ↓
NowPlaying component receives currentTask prop
  ↓
Displays task name, planned duration
  ↓
User selects Mode (Timer or Focus)
```

### Step 2: Timer Starts
```
User clicks "Start" OR flips device to Position A
  ↓
handlePositionChange('A') triggered
  ↓
useTimerStateMachine.startTimer() called
  ↓
setInterval every 1000ms: elapsedSeconds++
  ↓
useHourglassWebSocket.startSand(duration) 
  → Sends: {"command": "START_SAND", "duration_minutes": 25}
  ↓
UI updates: Timer display, progress bar, status
```

### Step 3: During Task
```
Position C detected (Horizontal) OR user clicks Pause
  ↓
pauseTimer() stops the interval
  ↓
useHourglassWebSocket.stopSand()
  → Sends: {"command": "STOP_SAND"}
  ↓
Status changes to "Paused"
  ↓
User can add notes (NotesModal)
  ↓
saveNotes(todoId, "Note text") 
  → Updates database notes column
```

### Step 4: Task Completion
```
Position B detected (Flipped) OR user clicks Complete
  ↓
completeTimer() stops interval
  ↓
useTimerAnalytics.saveSessionCompletion() called
  ↓
Prepares payload:
{
  todoId: 123,
  actualDurationSeconds: 1567,  ← stateMachine.elapsedSeconds
  mode: "focus",                ← stateMachine.mode
  notes: "Good session",        ← currentTask.notes
  planDurationMinutes: 45       ← stateMachine.planDurationMinutes
}
  ↓
API Request: PUT /api/todos/123
{
  completed: 1,
  time_actual_duration: 26,     ← Converted from seconds
  time_completed_at: "2024-05-16T14:30:00Z",
  mode: "focus",
  notes: "Good session"
}
  ↓
Database updated with all fields
  ↓
Component resets for next task
  ↓
onComplete() callback triggers parent refresh
```

---

## State Machine Logic Tree

```
Device Position Detected
  │
  ├─ Position A (Upright)
  │   │
  │   ├─ Timer Mode
  │   │   └─ If idle/completed: Start 25-min timer
  │   │   └─ If paused: Resume timer
  │   │
  │   └─ Focus Mode
  │       └─ If idle/completed: Start custom timer
  │       └─ If paused: Resume timer
  │
  ├─ Position B (Flipped)
  │   │
  │   ├─ Timer Mode
  │   │   └─ Complete timer → Save analytics
  │   │
  │   └─ Focus Mode
  │       └─ Complete timer → Save with overtime info
  │
  └─ Position C (Horizontal)
      │
      ├─ If timer running: Pause
      └─ Otherwise: No action
```

---

## Database Schema

```sql
CREATE TABLE todos (
    -- Existing fields
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    task TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    duration INTEGER,                    -- Planned duration
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- ✅ NEW ANALYTICS FIELDS
    time_actual_duration INTEGER,        -- Minutes actually spent
    time_completed_at DATETIME,          -- When completed
    notes TEXT,                          -- User notes
    mode TEXT DEFAULT 'timer'            -- 'timer' or 'focus'
);

-- Indexes for performance
CREATE INDEX idx_user_completed ON todos(user_id, completed);
CREATE INDEX idx_user_completed_at ON todos(user_id, time_completed_at);
```

---

## API Endpoints

### GET All Todos
```
GET /api/todos
Response: [{ id, task, duration, mode, notes, time_actual_duration, ... }]
```

### POST Create Todo
```
POST /api/todos
Body: { task, duration, due_date }
Response: { id, task, ... }
```

### PUT Update Todo (with Analytics)
```
PUT /api/todos/:id
Body: {
  task?,
  completed?,
  duration?,
  due_date?,
  notes?,                    ← NEW
  mode?,                     ← NEW
  time_actual_duration?,     ← NEW
  time_completed_at?         ← NEW
}
Response: { id, task, ..., notes, mode, time_actual_duration, ... }
```

### DELETE Todo
```
DELETE /api/todos/:id
Response: { message: "Todo deleted" }
```

### GET Analytics Summary (NEW)
```
GET /api/todos/analytics/summary?days=7
Response: {
  totalSessions: 5,
  totalMinutes: 245,
  avgMinutes: 49,
  modeBreakdown: { timer: 3, focus: 2 },
  sessions: [
    { id, task, duration, time_actual_duration, mode, notes, ... }
  ]
}
```

---

## State Transitions Diagram

```
                    ┌─────────────┐
                    │   IDLE      │
                    └──────┬──────┘
                           │
                     startTimer()
                           │
                           ▼
                    ┌─────────────┐
                    │  RUNNING    │
                    │             │
                    │  └─ TIMER   │
                    │  └─ COUNTED │
                    │  └─ PROGRESS│
                    └──────┬──────┘
                     │     │
         pauseTimer() │     │ completeTimer()
                     │     │
                     ▼     ▼
              ┌──────────────────┐
              │  PAUSED          │   ← resumeTimer() → back to RUNNING
              │                  │
              │  ├─ NOTES MODAL  │
              │  └─ EDIT OPTIONS │
              └──────┬───────────┘
                     │
              handleComplete() or
              Position B detected
                     │
                     ▼
              ┌──────────────────┐
              │  COMPLETED       │
              │                  │
              │  └─ SAVE DB      │
              │  └─ ANALYTICS    │
              │  └─ SEND RESULT  │
              └──────┬───────────┘
                     │
                resetTimer()
                     │
                     ▼
              ┌──────────────────┐
              │  IDLE (RESET)    │ ← Ready for next task
              └──────────────────┘
```

---

## Component Hierarchy

```
App
├─ Navigation
├─ Routes
│  ├─ Login
│  ├─ Todos (Main Page)
│  │  ├─ NowPlaying ⭐ (Uses: StateMachine, Analytics, WebSocket)
│  │  │  ├─ Mode Selector
│  │  │  ├─ Timer Display
│  │  │  ├─ Progress Bar
│  │  │  ├─ Control Buttons
│  │  │  ├─ Notes Button → NotesModal
│  │  │  │  └─ NotesModal ⭐
│  │  │  └─ Device Selector
│  │  │
│  │  ├─ QueueDisplay
│  │  │  └─ Task List
│  │  │
│  │  └─ TaskActions
│  │
│  ├─ TodoPage
│  ├─ Account
│  └─ Feedback
└─ Footer

⭐ = Components using new hooks/features
```

---

## Performance Optimizations

### Timer Updates
- Uses `setInterval` with cleanup
- Only updates UI on state changes
- No re-renders between seconds (batched updates)

### Database Operations
- Batch updates (single PUT request)
- Indexed queries by user_id and completion date
- Analytics computed server-side

### WebSocket
- Debounced commands (no duplicate sends)
- Connection pooling
- Auto-reconnect on disconnect

---

## Error Handling

```
Try-Catch Chains:

saveSessionCompletion()
  ├─ Catch: Database write error
  ├─ Catch: Network error
  └─ Return: Error message to user

handlePositionChange()
  ├─ Validate position value
  ├─ Check current state
  └─ Return null if invalid

startSand()
  ├─ Check WebSocket connected
  ├─ Check device subscribed
  └─ Log warning if failed
```

---

## Testing Strategy

### Unit Tests (Per Hook)
```javascript
// useTimerStateMachine
- Mode switching
- Position handling
- Time formatting
- Overtime detection

// useTimerAnalytics
- Session saving
- Stats calculation
- Note saving
- Error handling

// useHourglassWebSocket
- Command sending
- Device subscription
- Connection handling
```

### Integration Tests
```javascript
// Full workflow
1. Select task
2. Choose mode
3. Start timer (checks command sent)
4. Add notes
5. Complete (checks DB saved)
6. Verify analytics

// Hardware simulation
- Mock position changes
- Verify state transitions
- Check ESP32 commands
```

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] New columns exist in todos table
- [ ] Backend API updated
- [ ] Frontend builds without errors
- [ ] All hooks properly imported
- [ ] WebSocket connection working
- [ ] ESP32 receiving commands
- [ ] Analytics endpoint responding
- [ ] Notes modal appearing
- [ ] Overtime detection working

---

**This architecture provides:**
✅ Clean separation of concerns
✅ Reusable hooks for other components
✅ Scalable analytics system
✅ Real-time device communication
✅ Comprehensive error handling
✅ Optimized performance
