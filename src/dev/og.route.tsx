import { getBundle } from '@/content/loader';
import { OgCard, OgIcon } from './og/OgCard';

/** `/dev/og` — the OG image; `/dev/og?icon` — the apple-touch icon. Rendered by `npm run og:render`. */
export default function OgRoute() {
  const icon = new URLSearchParams(window.location.search).has('icon');
  return icon ? <OgIcon /> : <OgCard bundle={getBundle()} />;
}
