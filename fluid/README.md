# WebGL Fluid Simulation

This is a WebGL fluid simulation project converted from JavaScript to TypeScript. The simulation runs in real-time in the browser and provides interactive fluid dynamics visualization.

## Project Structure

- `/fluid/js/` - Original JavaScript implementation
- `/fluid/ts/` - TypeScript implementation
- `/dist/` - Compiled JavaScript output (generated after build)

## Features

- Real-time WebGL fluid simulation
- Various effects like bloom and sunrays
- Interactive controls via GUI
- Mobile-friendly
- Multiple splat creation methods
- Screenshot capture

## Setup and Run

1. Install dependencies:

   ```
   npm install
   ```

2. Build the TypeScript code:

   ```
   npm run build
   ```

3. Start the local server:

   ```
   npm start
   ```

4. Open your browser and navigate to the local server URL.

## Implementation Details

The project has been fully converted to TypeScript with proper type definitions. The main components include:

- `config.ts` - Configuration settings and pointer prototype
- `webgl-utils.ts` - WebGL utility functions
- `core-classes.ts` - Core Material and Program classes
- `framebuffers.ts` - Framebuffer implementation
- `shaders.ts` - All shaders used in the simulation
- `simulation.ts` - Fluid dynamics simulation
- `input.ts` - User input handling
- `rendering.ts` - Rendering functions
- `gui.ts` - GUI controls
- `main.ts` - Main application initialization and loop

## Credits

This project is based on the original WebGL Fluid Simulation by Pavel Dobryakov, but converted to TypeScript for better code organization and type safety.
