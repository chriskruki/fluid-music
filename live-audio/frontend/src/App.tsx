import React from "react";
import AudioPlayer from "./components/AudioPlayer";

/**
 * Main application component
 */
const App: React.FC = () => {
  // WebSocket URL for the audio streaming server
  const serverUrl = "ws://localhost:8082";

  return (
    <div className="app-container">
      <header>
        <h1>Live Audio Streaming</h1>
      </header>

      <main>
        <AudioPlayer serverUrl={serverUrl} />
      </main>

      <footer>
        <p>Streams audio from the server to the browser using WebSockets</p>
      </footer>
    </div>
  );
};

export default App;
