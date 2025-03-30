# WebGL Fluid Simulation with Remote Control

A WebGL-based fluid simulation that can be controlled remotely via WebSockets. This project includes both a simulation page and a separate control page that can be used to manipulate the fluid remotely.

## Features

- WebGL-based fluid simulation with adjustable parameters
- Real-time remote control via WebSockets
- Multiple control patterns and effects
- Multi-touch support
- User-friendly control interface

## Project Structure

- `/ts`: TypeScript source files for the fluid simulation
- `/static`: Static assets (CSS, images)
- `server.ts`: TypeScript WebSocket server implementation
- `control.html`: Remote control interface

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

## Running the Application

### Development Mode

Start both the client and server in development mode:

```bash
npm run dev
```

Or run them separately:

```bash
# Run just the client
npm run dev:client

# Run just the server
npm run dev:server
```

This starts the server at http://localhost:3000 with the following endpoints:

- `/`: The fluid simulation page
- `/control`: The remote control page

### Production Mode

Build the application and start the server:

```bash
npm run build
npm start
```

## Usage

1. Open the simulation page in one browser window
2. Open the control page in another browser window or device
3. Use the control page to interact with the fluid simulation remotely

### Control Interface

- **Click and drag** on the control canvas to create fluid splats
- Use the buttons at the bottom to trigger special effects:
  - **Random Splats**: Create random splats across the simulation
  - **Pattern Buttons**: Create specific flow patterns in the simulation

## How It Works

The application uses WebSockets to establish a real-time connection between the control page and the fluid simulation. User interactions on the control page are transmitted to the server, which then broadcasts them to all connected simulation pages.

### Communication Protocol

- Connection is established with role-based identification
- Input events (mouse/touch) are normalized and transmitted
- Special commands can be sent for predefined effects
- Session IDs track different controllers and simulators

## Technologies Used

- WebGL for fluid simulation rendering
- TypeScript for type-safe code (both client and server)
- WebSockets for real-time communication
- Express for serving the web application
- Vite for development and building
