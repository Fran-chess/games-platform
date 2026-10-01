'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

/** Tiempo que se muestra el aviso antes de recargar: en el stand nadie va a tocar "Recargar" */
const AUTO_RELOAD_MS = 5000;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary global. Ante un error de render muestra un aviso y recarga la página:
 * el juego corre como kiosco y recargar es lo único que garantiza un estado limpio.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  private reloadTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary:', error, errorInfo.componentStack);

    // En desarrollo no se recarga sola: taparía el error que se está depurando
    if (process.env.NODE_ENV === 'production') {
      this.reloadTimer = setTimeout(this.reload, AUTO_RELOAD_MS);
    }
  }

  componentWillUnmount() {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
  }

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="h-screen flex items-center justify-center p-8">
        <div className="bg-slate-900/80 rounded-3xl p-8 max-w-md text-center border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">Error temporal</h2>
          <p className="text-white/80 mb-6">
            Tuvimos un problema técnico. El juego se va a reiniciar en unos segundos.
          </p>
          <button
            type="button"
            onClick={this.reload}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold"
          >
            Reiniciar ahora
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
