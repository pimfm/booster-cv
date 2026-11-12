/** Pure selectors over the experience state. Components share these mappings. */
import { cardsInPack, getCard, getPack, totalWithContact } from '@/content/bundle';
import type { Card, ContentBundle, Pack } from '@/content/types';
import { holdCurve } from './hold';
import type { ExperienceState } from './types';

/** The hold → visual mapping of INTERACTION-SPEC §1 (box) and §3 (pack), at full progress. */
const HOLD_VISUAL = {
  boxCompress: 0.03,
  packCompress: 0.04,
  packSkewDeg: -1.5,
  seamOpacityRest: 0.4,
  seamOpacityGain: 0.6,
  tabRotateDeg: -18,
  tabLiftPx: -6,
  contentShiftPx: 2,
} as const;

export interface HoldVisual {
  /** `holdCurve(p)` — everything below is derived from it */
  curved: number;
  scaleBox: number;
  scalePack: number;
  skewPackDeg: number;
  seamOpacity: number;
  /** seam highlight width as a fraction 0..1 of the crimped edge */
  seamWidth: number;
  tabRotateDeg: number;
  tabLiftPx: number;
  contentShiftPx: number;
}

/** Visual numbers for a LINEAR hold progress `p` (state.holdProgress or the motion value). */
export function holdVisual(p: number): HoldVisual {
  const curved = holdCurve(p);
  return {
    curved,
    scaleBox: 1 - HOLD_VISUAL.boxCompress * curved,
    scalePack: 1 - HOLD_VISUAL.packCompress * curved,
    skewPackDeg: HOLD_VISUAL.packSkewDeg * curved,
    seamOpacity: HOLD_VISUAL.seamOpacityRest + HOLD_VISUAL.seamOpacityGain * curved,
    seamWidth: curved,
    tabRotateDeg: HOLD_VISUAL.tabRotateDeg * curved,
    tabLiftPx: HOLD_VISUAL.tabLiftPx * curved,
    contentShiftPx: HOLD_VISUAL.contentShiftPx * curved,
  };
}

/** A pointer or key is down on the box or the focused pack (not: relaxing). */
export function isHolding(state: ExperienceState): boolean {
  return state.holdDirection === 'up';
}

export interface PackProgress {
  packId: string;
  collected: number;
  total: number;
}

/** One entry per pack, in shelf order. */
export function progressByPack(state: ExperienceState, bundle: ContentBundle): PackProgress[] {
  return bundle.packs.map((pack) => {
    const cards = cardsInPack(bundle, pack.id);
    return {
      packId: pack.id,
      collected: cards.filter((card) => state.collected.includes(card.id)).length,
      total: cards.length,
    };
  });
}

/**
 * Cards of a pack that are not in the binder yet (a card on the stage still counts).
 * Defaults to the focused pack; no pack → 0.
 */
export function remainingInPack(
  state: ExperienceState,
  bundle: ContentBundle,
  packId: string | null = state.focusedPackId,
): number {
  if (packId === null) return 0;
  return cardsInPack(bundle, packId).filter((card) => !state.collected.includes(card.id)).length;
}

export function collectedCount(state: ExperienceState): number {
  return state.collected.length;
}

/** Every card in a pack plus the contact card — the binder's full size. */
export function totalCount(bundle: ContentBundle): number {
  return totalWithContact(bundle);
}

/** The binder is full, contact card included. */
export function isComplete(state: ExperienceState, bundle: ContentBundle): boolean {
  return collectedCount(state) >= totalCount(bundle);
}

function cardOrNull(bundle: ContentBundle, id: string | null): Card | null {
  return id === null ? null : (getCard(bundle, id) ?? null);
}

export function stageCard(state: ExperienceState, bundle: ContentBundle): Card | null {
  return cardOrNull(bundle, state.stageCardId);
}

export function detailCard(state: ExperienceState, bundle: ContentBundle): Card | null {
  return cardOrNull(bundle, state.detailCardId);
}

export function isPackOpened(state: ExperienceState, packId: string): boolean {
  return state.openedPacks.includes(packId);
}

export function focusedPack(state: ExperienceState, bundle: ContentBundle): Pack | null {
  return state.focusedPackId === null ? null : (getPack(bundle, state.focusedPackId) ?? null);
}
