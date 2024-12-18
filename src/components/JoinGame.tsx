import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export function JoinGame() {
  const [sessionId, setSessionId] = useState('');
  const { createSession, joinSession, error } = useGameStore();

  const handleCreate = async () => {
    try {
      const id = await createSession();
      // Copy to clipboard
      await navigator.clipboard.writeText(id);
      alert('Game code copied to clipboard!');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinSession(sessionId);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8">
      <div className="space-y-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Join a Game</h2>
        <p className="text-gray-600">Create a new game or join an existing one</p>
      </div>

      <button
        onClick={handleCreate}
        className="w-full max-w-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Create New Game
      </button>

      <div className="w-full max-w-xs">
        <div className="text-center mb-2">
          <span className="text-gray-500">or</span>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="Enter game code"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Join Game
          </button>
        </form>
      </div>

      {error && (
        <div className="text-red-600 text-center">{error}</div>
      )}
    </div>
  );
}