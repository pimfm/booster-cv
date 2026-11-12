// F-06 stand-in. CH-01 replaces the body (sound toggle, reset confirm, shortcuts popover);
// PL-01 owns the language part. Keep the `data-slot` root and the test ids.
import { useEffect } from 'react';
import { useExperience } from '@/machine';
import { useLocale } from '@/platform/i18n';
import stub from '@/app/stub.module.css';

export function Header() {
  const { state, dispatch, bundle } = useExperience();
  const { locale, toggle, t } = useLocale();
  const other = locale === 'en' ? 'nl' : 'en';

  // Stand-in for §8: no confirm and no fade-out yet, so resetting ends at once.
  useEffect(() => {
    if (state.phase === 'resetting') dispatch({ type: 'RESET_DONE' });
  }, [state.phase, dispatch]);

  return (
    <header data-slot="header">
      <h1 className={stub.title}>{bundle.meta.name}</h1>
      <div className={stub.row}>
        <button
          type="button"
          data-testid="lang-toggle"
          data-locale={locale}
          className={stub.button}
          aria-label={`${t('language')}: ${t(`lang_${other}`)}`}
          lang={other}
          onClick={toggle}
        >
          {t(`lang_${other}`)}
        </button>
        <button
          type="button"
          data-testid="reset"
          className={stub.button}
          onClick={() => dispatch({ type: 'RESET' })}
        >
          {t('reset')}
        </button>
      </div>
    </header>
  );
}
