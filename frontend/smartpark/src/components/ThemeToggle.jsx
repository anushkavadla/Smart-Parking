import { useTheme } from '../theme/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
    >
      {theme === 'light' ? '◐' : '○'}
    </button>
  );
}
