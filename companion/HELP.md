## Axia Livewire GPIO

This module controls Livewire GPIO pins (GPI/GPO) on Axia hardware using the CMsg2 binary protocol over UDP multicast group `239.192.255.4`.

### Configuration

**Network Interface IP** — The IP address of the network interface to use for multicast communication. Set to `0.0.0.0` to use the system default, or specify the IP of a specific NIC connected to the Livewire network.

**Operating Mode** — Choose between two roles:

- **Console** — The module acts as a mixing console or controller. It listens for GPI indications from GPIO nodes (port 2055) and sends GPO commands to nodes (port 2060). Use this mode when you want Companion to control relays/lamps on hardware GPIO nodes, or react to physical button presses coming from nodes.

- **Node** — The module acts as a virtual GPIO node. It listens for GPO commands from a console (port 2060) and sends GPI indications (port 2055). Use this mode when a real mixing console is the controller and Companion should appear as a GPIO device — for example, to receive on-air tally from the console or send virtual button events.

### Actions

#### Console Mode

| Action                          | Description                                           |
| ------------------------------- | ----------------------------------------------------- |
| **Set GPO Pin (Latched)**       | Drive a single GPO pin high or low (latched)          |
| **Pulse GPO Pin**               | Pulse a GPO pin for a specified duration (10–7750 ms) |
| **Toggle GPO Pin**              | Toggle a GPO pin based on the last known GPI state    |
| **Set All GPO Pins on Channel** | Set all 5 GPO pins on a channel in one packet         |

#### Node Mode

| Action                          | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| **Assert GPI Pin (Latched)**    | Assert a GPI indication high or low              |
| **Pulse GPI Pin**               | Pulse a GPI indication for a specified duration  |
| **Set All GPI Pins on Channel** | Assert all 5 GPI pins on a channel in one packet |

### Feedbacks

- **GPI Pin State** (Console mode) — Activates when a GPI pin matches the specified level (high/low)
- **GPO Received State** (Node mode) — Activates when a received GPO command matches the specified level

### Variables

Variables are created dynamically as GPIO indications arrive:

- Console mode: `gpi_{channel}_{pin}_level` (e.g., `gpi_11699_3_level`) — Values: `high`, `low`, `unknown`
- Node mode: `gpo_{channel}_{pin}_received` (e.g., `gpo_11699_3_received`) — Values: `high`, `low`, `unknown`

### Presets

Pre-built buttons are provided for channel 1 in both modes:

- **GPO/GPI High** — Latch a pin high on press
- **GPO/GPI Low** — Latch a pin low on press
- **GPO/GPI Momentary** — High on press, low on release
- **GPI/GPO Monitor** — Display-only button showing current pin state with feedback

### Livewire Channel Numbers

The Livewire channel number (1–32767) identifies the logical audio/GPIO channel on the network. This is the same number shown in Livewire device configuration pages. A single GPIO node typically exposes both a GPI and GPO bank on the same channel number.

### Network Requirements

- The Companion host must be on the same network (or VLAN) as the Livewire equipment
- IGMP snooping should be properly configured on network switches
- Multicast group `239.192.255.4` must be reachable
