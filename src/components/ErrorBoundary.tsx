import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetStorage = () => {
    if (window.confirm('Reset local storage cache? Your current data will be restored to fresh seed state.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#080b11',
          color: '#f9fafb',
          fontFamily: "'Inter', sans-serif",
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{
            maxWidth: '560px',
            backgroundColor: '#111827',
            border: '1px solid #1f2937',
            borderRadius: '12px',
            padding: '2.5rem',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              margin: '0 auto 1.25rem',
              fontWeight: 800
            }}>
              ⚠️
            </div>
            
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              Something went wrong
            </h2>
            
            <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              An unexpected application error occurred. You can reload the page or clear temporary application cache to recover.
            </p>

            {this.state.error && (
              <div style={{
                backgroundColor: '#080b11',
                border: '1px solid #1f2937',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: '#ef4444',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                maxHeight: '140px'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '9px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Application
              </button>
              
              <button
                onClick={this.handleResetStorage}
                style={{
                  backgroundColor: 'transparent',
                  color: '#9ca3af',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  padding: '9px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Reset App Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
