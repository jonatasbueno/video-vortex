import type { Platform } from '../types.js';

/** Non-adult platforms shown in the main list (plus "Outros" inserted alphabetically by label). */
export const GENERAL_PLATFORMS: Platform[] = [
  {
    id: 'dailymotion',
    label: 'Dailymotion',
    category: 'general',
    match: [/dailymotion\.com/i, /dai\.ly/i],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    category: 'general',
    match: [/facebook\.com/i, /fb\.watch/i, /fb\.com/i],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    category: 'general',
    match: [/instagram\.com/i, /instagr\.am/i],
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    category: 'general',
    match: [/linkedin\.com/i],
  },
  {
    id: 'pinterest',
    label: 'Pinterest',
    category: 'general',
    match: [/pinterest\./i, /pin\.it/i],
  },
  {
    id: 'reddit',
    label: 'Reddit',
    category: 'general',
    match: [/reddit\.com/i, /redd\.it/i],
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    category: 'general',
    match: [/tiktok\.com/i, /vm\.tiktok\.com/i],
  },
  {
    id: 'twitch',
    label: 'Twitch',
    category: 'general',
    match: [/twitch\.tv/i, /clips\.twitch\.tv/i],
  },
  {
    id: 'twitter',
    label: 'Twitter / X',
    category: 'general',
    match: [/twitter\.com/i, /x\.com/i, /t\.co/i],
  },
  {
    id: 'vimeo',
    label: 'Vimeo',
    category: 'general',
    match: [/vimeo\.com/i],
  },
  {
    id: 'youtube',
    label: 'YouTube',
    category: 'general',
    match: [/youtube\.com/i, /youtu\.be/i, /youtube-nocookie\.com/i],
  },
];

export const ADULT_PLATFORMS: Platform[] = [
  {
    id: 'erome',
    label: 'Erome',
    category: 'adult',
    match: [/erome\.com/i],
  },
  {
    id: 'pornhub',
    label: 'Pornhub',
    category: 'adult',
    match: [/pornhub\.com/i, /pornhub\.org/i],
  },
  {
    id: 'tnaflix',
    label: 'TNAFlix',
    category: 'adult',
    match: [/tnaflix\.com/i],
  },
  {
    id: 'xhamster',
    label: 'xHamster',
    category: 'adult',
    match: [/xhamster\.com/i, /xhamster\./i],
  },
  {
    id: 'xvideos',
    label: 'XVideos',
    category: 'adult',
    match: [/xvideos\.com/i],
  },
  {
    id: 'youporn',
    label: 'YouPorn',
    category: 'adult',
    match: [/youporn\.com/i],
  },
];

export const OTHERS_ID = 'others';
export const ADULT_MENU_ID = 'adult-menu';
export const GENERIC_ID = 'generic';

export const OTHERS_PLATFORM: Platform = {
  id: OTHERS_ID,
  label: 'Outros',
  category: 'special',
  match: [],
};

export const ADULT_MENU_PLATFORM: Platform = {
  id: ADULT_MENU_ID,
  label: '+18',
  category: 'special',
  match: [],
};

export const GENERIC_PLATFORM: Platform = {
  id: GENERIC_ID,
  label: 'Genérico (yt-dlp)',
  category: 'special',
  match: [],
};

export function sortByLabel(platforms: Platform[]): Platform[] {
  return [...platforms].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
  );
}

export function getMainPlatformList(): Platform[] {
  return sortByLabel([...GENERAL_PLATFORMS, OTHERS_PLATFORM]);
}

export function getOthersSubmenuList(): Platform[] {
  return sortByLabel([ADULT_MENU_PLATFORM, GENERIC_PLATFORM]);
}

export function getAdultPlatformList(): Platform[] {
  return sortByLabel(ADULT_PLATFORMS);
}

export function getAllDetectablePlatforms(): Platform[] {
  return [...GENERAL_PLATFORMS, ...ADULT_PLATFORMS];
}

export function filterPlatforms(platforms: Platform[], query: string): Platform[] {
  const q = query.trim().toLowerCase();
  if (!q) return platforms;
  return platforms.filter((p) => p.label.toLowerCase().includes(q));
}

export function findPlatformById(id: string): Platform | undefined {
  return (
    GENERAL_PLATFORMS.find((p) => p.id === id) ??
    ADULT_PLATFORMS.find((p) => p.id === id) ??
    [OTHERS_PLATFORM, ADULT_MENU_PLATFORM, GENERIC_PLATFORM].find((p) => p.id === id)
  );
}
