import { describe, expect, it } from 'vitest';
import { detectPlatform, isAdultPlatform } from '../../src/platforms/detect.js';
import { ADULT_MENU_ID, OTHERS_ID, getMainPlatformList, getOthersSubmenuList } from '../../src/platforms/catalog.js';

/**
 * Integration-style state machine for age gate without rendering Ink.
 */
function reduceWizard(
  state: { step: string; adultAccepted: boolean; platformId?: string },
  action:
    | { type: 'url'; url: string }
    | { type: 'select'; id: string }
    | { type: 'age'; accept: boolean },
): typeof state {
  if (action.type === 'url') {
    const detected = detectPlatform(action.url);
    if (!detected) return { ...state, step: 'platform' };
    if (isAdultPlatform(detected) && !state.adultAccepted) {
      return { ...state, step: 'ageGate', platformId: detected.id };
    }
    return { ...state, step: 'probing', platformId: detected.id };
  }

  if (action.type === 'select') {
    if (state.step === 'platform' && action.id === OTHERS_ID) {
      return { ...state, step: 'others' };
    }
    if (state.step === 'others' && action.id === ADULT_MENU_ID) {
      return { ...state, step: 'adult' };
    }
    if (state.step === 'adult') {
      return { ...state, step: 'ageGate', platformId: action.id };
    }
    return { ...state, step: 'probing', platformId: action.id };
  }

  if (action.type === 'age') {
    if (!action.accept) return { step: 'url', adultAccepted: false };
    return { ...state, adultAccepted: true, step: 'probing' };
  }

  return state;
}

describe('age gate flow', () => {
  it('asks age gate for adult URL and returns to start on decline', () => {
    let state = { step: 'url', adultAccepted: false };
    state = reduceWizard(state, { type: 'url', url: 'https://www.pornhub.com/view_video.php?viewkey=1' });
    expect(state.step).toBe('ageGate');
    state = reduceWizard(state, { type: 'age', accept: false });
    expect(state.step).toBe('url');
    expect(state.adultAccepted).toBe(false);
  });

  it('continues after accept', () => {
    let state = { step: 'url', adultAccepted: false };
    state = reduceWizard(state, { type: 'url', url: 'https://www.xvideos.com/video1/x' });
    state = reduceWizard(state, { type: 'age', accept: true });
    expect(state.adultAccepted).toBe(true);
    expect(state.step).toBe('probing');
  });

  it('reaches age gate via Outros -> +18 selection', () => {
    expect(getMainPlatformList().some((p) => p.id === OTHERS_ID)).toBe(true);
    expect(getOthersSubmenuList().some((p) => p.id === ADULT_MENU_ID)).toBe(true);

    let state = { step: 'url', adultAccepted: false };
    state = reduceWizard(state, { type: 'url', url: 'https://unknown.example/v/1' });
    expect(state.step).toBe('platform');
    state = reduceWizard(state, { type: 'select', id: OTHERS_ID });
    expect(state.step).toBe('others');
    state = reduceWizard(state, { type: 'select', id: ADULT_MENU_ID });
    expect(state.step).toBe('adult');
    state = reduceWizard(state, { type: 'select', id: 'xhamster' });
    expect(state.step).toBe('ageGate');
  });
});
