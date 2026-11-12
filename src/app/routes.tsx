import {
  createElement,
  lazy,
  Suspense,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';

/**
 * Tiny path router. `/` is the experience; everything under `/dev` is development-only.
 *
 * Dev pages register by file name: `src/dev/<path>.route.tsx` with a default-exported component
 * is served at `/dev/<path>` (e.g. `src/dev/direction/1.route.tsx` → `/dev/direction/1`).
 * The glob is behind `import.meta.env.DEV`, so none of it reaches the production bundle.
 */
type Loader = () => Promise<{ default: ComponentType }>;

const devModules: Record<string, Loader> = import.meta.env.DEV
  ? (import.meta.glob('/src/dev/**/*.route.tsx') as Record<string, Loader>)
  : {};

const devRoutes = new Map<string, LazyExoticComponent<ComponentType>>(
  Object.entries(devModules).map(([file, load]) => [
    file.replace(/^\/src/, '').replace(/\.route\.tsx$/, ''),
    lazy(load),
  ]),
);

export function devRoutePaths(): string[] {
  return [...devRoutes.keys()].sort();
}

export function currentPath(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = window.location.pathname.slice(base.length) || '/';
  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

export function Router({ home }: { home: ReactNode }) {
  const path = currentPath();
  if (path === '/dev') {
    return (
      <nav aria-label="dev">
        <ul>
          {devRoutePaths().map((p) => (
            <li key={p}>
              <a href={p}>{p}</a>
            </li>
          ))}
        </ul>
      </nav>
    );
  }
  const Dev = devRoutes.get(path);
  if (Dev) {
    return <Suspense fallback={null}>{createElement(Dev)}</Suspense>;
  }
  return <>{home}</>;
}
