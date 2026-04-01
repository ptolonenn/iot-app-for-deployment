# System Architecture

## Purpose

This document defines the current system architecture for the IoT app, including the frontend, backend, broker, and lamp/device communication.

The purpose is to make the data flow, message formats, and responsibilities of each part clear.

---

## Components
- Frontend
- Backend
- Broker (Node-RED)
- Lamp/Device

## End-to-End Data Flow

### Flow A: User updates tasks from the app
1. User creates, edits, completes, or deletes a task in the frontend.
2. Frontend sends an HTTP request to the backend.
3. Backend validates the request and stores the change in SQLite.
4. Backend determines the relevant lamp state based on current task data.
5. Backend sends a command to the broker.
6. Broker routes the command to the lamp/device.
7. Lamp updates its behavior or color.

### Flow B: Device sends data back
1. Lamp/device sends state or sensor data to the broker.
2. Broker parses the incoming message.
3. Broker forwards structured JSON data to the backend webhook.
4. Backend processes or stores that data.

### Flow C: real-time app updates
1. Frontend connects to a live update channel (WebSocket).
2. Backend or broker pushes real-time device/task state changes.
3. Frontend updates UI immediately.
4. Frontent UI refreshes once a minute, for colour changes to task's time left

## JSON Contracts

### 1.Todo object (app ↔ backend)

Create/update request body:
```json
{
  "task": "Finish DTAP report",
  "completed": 0,
  "duration": 45,
  "due_date": "2026-03-26T18:00:00Z"
}
```
Response object
```json
{
  "id": 12,
  "user_id": 3,
  "task": "DTAP report",
  "completed": 0,
  "duration": 45,
  "due_date": "2026-03-26T18:00:00Z",
  "created_at": "2026-03-26T15:00:00Z"
}
```

### 2. Auth token (Frontend ↔ Backend)
Returned after POST /api/auth/login or /api/auth/register.
Sent in every subsequent request as a header: Authorization: Bearer <token>
```json
{
  "user": { "id": 1, "username": "username" },
  "token": ""
}
```

### 3. Lamp command (Backend → Broker) - not yet implemented
Sent via POST /device-command to Node-RED when a task changes.
```json
{
  "device": "device-uuid",
  "actuator": "led",
  "value": "#ff8e37"
}
```

### 4. Device sensor message (Broker → Backend webhook) - not yet implemented
Node-RED POSTs this to POST /api/webhook/sensor-data after parsing 

```json
{
  "device": "device-uuid",
  "sensor": "button/slider",
  "value": 1,
  "timestamp": 1234567890
}
```
### 5. WebSocket real-time update (Broker/Backend → Frontend) - not yet implemented
```json
{
  "type": "device_state",
  "device": "device-uuid",
  "activeTaskId": 12,
  "taskName": "DTAP report",
  "highestUrgency": "high",
  "lampColor": "#ff8e37",
  "completed": 0,
  "updatedAt": "2026-03-26T16:30:00Z"
}
```

task completion/update event
```json
{
  "type": "task_update",
  "payload": {
    "id": 12,
    "task": "DTAP report",
    "completed": 1
  }
}
```

## Deployment Notes

- Deployment should happen in two phases:
  1. early integration deployment for testing
  2. final cleaned deployment for the demo
- Before deployment, localhost-only URLs, secrets, and environment variables must be reviewed and cleaned.

## Open Questions
...
