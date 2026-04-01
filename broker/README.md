# ProtoFlow Message Broker

[NodeRED](https://nodered.org/) is a visual, flow-based programming tool that runs on Node.js. In ProtoFlow, it acts as a lightweight message router — you don't need to write any NodeRED code, just import the provided flows. The NodeRED editor (a browser-based UI) lets you inspect message routing in real time, which is helpful for debugging.

NodeRED-based message broker that connects ESP32 devices to web applications. Handles protocol translation between the compact device protocol and standard JSON used by web clients.

## What It Does

- **Device gateway** -- accepts WebSocket connections from ESP32 devices
- **Protocol parsing** -- decodes compact sensor messages into structured JSON
- **Protocol encoding** -- converts JSON actuator commands into device-compatible format
- **Web client relay** -- forwards parsed sensor data to connected web applications
- **Webhook forwarding** -- POSTs sensor data to the backend API for storage
- **Actuator command routing** -- receives commands from the backend and routes them to the correct device

## WebSocket Endpoints

| Endpoint | Protocol | Purpose |
|----------|----------|---------|
| `/ws/device` | Compact (binary codes + JSON) | ESP32 device connections |
| `/ws/app` | JSON messages | Web application connections |

**Device protocol**: Devices send compact messages like `S57.41` (slider value) or `B1` (button pressed). The broker parses these into full JSON with device UUID, sensor name, and timestamp before relaying to web clients.

**App protocol**: Web clients send and receive standard JSON messages (subscriptions, device lists, actuator commands).

## HTTP Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/device-command` | POST | Backend-triggered actuator commands |

The backend sends commands as JSON:

```json
{
  "device": "device-uuid",
  "actuator": "led",
  "value": true
}
```

The broker looks up the device's WebSocket connection and forwards the command.

## Setup

1. Install and start NodeRED:

```bash
npx node-red
```

2. Open the NodeRED editor (default: `http://localhost:1880`)
3. Import `flows.json`: click the menu (top-right) → **Import** → select the `flows.json` file → **Import**
4. Deploy the flows

### Configure Webhook URL

The flows include a webhook node that POSTs sensor data to the backend. Update the URL to match your backend:

```
http://localhost:3000/api/webhook/sensor-data
```

Edit the HTTP request node in the "Webhook to Backend" flow to set the correct URL.

## NodeRED Settings

The included `settings.js` configures:

| Setting | Value | Effect |
|---------|-------|--------|
| `uiPort` | `1880` | NodeRED listens on port 1880 |

When deployed behind a reverse proxy, you typically configure:

| Setting | Value | Effect |
|---------|-------|--------|
| `httpAdminRoot` | `"/nr"` | Editor UI available at `/nr/` |
| `httpNodeRoot` | `"/"` | Runtime endpoints (WebSocket, HTTP-in) at root |

This means WebSocket endpoints are at `/ws/device` and `/ws/app` (not `/nr/ws/device`).

## Webhook Configuration

The broker forwards all parsed sensor data to the backend via HTTP POST:

```
POST http://localhost:3000/api/webhook/sensor-data
Content-Type: application/json

{
  "device": "device-uuid",
  "sensor": "slider",
  "value": 57.41,
  "timestamp": 1234567890
}
```

This is how sensor data gets persisted to the database. The backend processes the webhook and stores the measurement.

## Customizing Flows

Open the NodeRED editor to modify the flows:

1. **Adding message types** -- edit the function nodes in the device gateway flow to handle new message formats
2. **Filtering data** -- add switch or function nodes between the parser and relay nodes
3. **Additional webhooks** -- duplicate the HTTP request node to forward data to other services
4. **Rate limiting** -- add delay nodes to throttle high-frequency sensors

The flows are organized into labeled groups. Each group handles one concern (device connections, parsing, relay, webhook, commands).

## Further Reading

- [Protocol Specification](../docs/protocol.md)
- [Architecture Overview](../docs/architecture.md)
