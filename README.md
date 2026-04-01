# companion-module-axia-livewire-gpio

A [Bitfocus Companion](https://bitfocus.io/companion) module for controlling Axia Livewire GPIO pins (GPI/GPO) using the CMsg2 binary protocol over UDP multicast.

## Overview

This module communicates with Livewire GPIO hardware (xNode, PowerStation, QOR, Fusion, Element, iQ, etc.) using the CMsg2 binary protocol on multicast group `239.192.255.4`. It supports two operating modes:

- **Console mode** — Send GPO commands to hardware nodes and receive GPI state indications
- **Node mode** — Emulate a GPIO node, sending GPI indications to a console and receiving GPO commands

## Features

- Set, pulse, and toggle individual GPO/GPI pins
- Batch-set all 5 pins on a channel in a single packet
- Boolean feedbacks that react to GPI/GPO state changes
- Dynamic variables for every observed pin state
- Pre-built button presets for common GPIO operations

## Configuration

| Field                    | Description                                                  |
| ------------------------ | ------------------------------------------------------------ |
| **Network Interface IP** | IP of the interface to use for multicast (default `0.0.0.0`) |
| **Operating Mode**       | `Console` or `Node` — determines send/receive direction      |

See [HELP.md](./companion/HELP.md) and [LICENSE](./LICENSE)

## Development

Executing a `yarn` command should perform all necessary steps to develop the module, if it does not then follow the steps below.

The module can be built once with `yarn build`. This should be enough to get the module to be loadable by Companion.

While developing the module, by using `yarn dev` the compiler will be run in watch mode to recompile the files on change.
