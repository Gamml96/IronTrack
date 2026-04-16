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
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-md w-full border-destructive/50 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-destructive/5 border-b border-destructive/20 p-6">
              <CardTitle className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                Ops! Algo deu errado
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-foreground font-medium">
                {errorMessage}
              </p>
              {technicalDetails && (
                <div className="p-3 bg-muted rounded-xl text-[10px] font-mono text-muted-foreground break-all overflow-auto max-h-32">
                  {technicalDetails}
                </div>
              )}
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full h-12 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar Aplicativo
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
