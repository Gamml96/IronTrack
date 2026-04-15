import { useTheme } from './ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 bg-card border border-border p-1 rounded-lg">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('light')}
        className={`h-8 w-8 ${theme === 'light' ? 'bg-accent text-accent-foreground' : 'text-text-dim'}`}
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('dark')}
        className={`h-8 w-8 ${theme === 'dark' ? 'bg-accent text-accent-foreground' : 'text-text-dim'}`}
      >
        <Moon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme('system')}
        className={`h-8 w-8 ${theme === 'system' ? 'bg-accent text-accent-foreground' : 'text-text-dim'}`}
      >
        <Laptop className="h-4 w-4" />
      </Button>
    </div>
  );
}
