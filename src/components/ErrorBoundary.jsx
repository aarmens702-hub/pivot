import React from 'react';

// Top-level error boundary. Catches render-time errors anywhere in the app
// and shows a friendly fallback with a Reload button. Without this, a thrown
// error in any component would leave the user staring at a white screen.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[pivot] render error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="text-5xl">😬</div>
          <div className="text-3xl font-black text-gray-900">Something broke.</div>
          <div className="text-gray-600 text-sm">
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-700 active:scale-95 transition-all"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
