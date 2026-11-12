import { Experience } from './Experience';
import { Router } from './routes';

export function App() {
  return <Router home={<Experience />} />;
}
