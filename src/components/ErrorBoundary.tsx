import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Ocorreu um erro inesperado.";
      let technicalDetails = this.state.error?.message || "";

      try {
        // Check if it's a Firestore error JSON
        const parsed = JSON.parse(technicalDetails);
        if (parsed.error && parsed.operationType) {
          errorMessage = `Erro no banco de dados (${parsed.operationType}): ${parsed.error}`;
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'sans-serif'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '24px',
            padding: '2rem',
            textAlign: 'center',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ color: '#ff4444', marginBottom: '1rem' }}>
              <AlertTriangle size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              Ops! Algo deu errado
            </h2>
            <p style={{ color: '#aaa', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {errorMessage}
            </p>
            {technicalDetails && (
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#000',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                color: '#666',
                wordBreak: 'break-all',
                maxHeight: '100px',
                overflowY: 'auto',
                marginBottom: '1.5rem',
                textAlign: 'left'
              }}>
                {technicalDetails}
              </div>
            )}
            <button 
              onClick={() => window.location.reload()} 
              style={{
                width: '100%',
                height: '3.5rem',
                backgroundColor: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <RefreshCw size={18} />
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
