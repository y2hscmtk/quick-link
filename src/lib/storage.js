import { createId } from './shortcuts.js';

export const STORAGE_KEY = 'quick-link:groups';

const DEFAULT_GROUPS = [
  {
    id: createId(),
    name: 'WORK',
    collapsed: false,
    items: [
      {
        id: createId(),
        title: 'Google',
        url: 'https://www.google.com/',
      },
    ],
  },
];

function normalizeStoredGroups(input) {
  if (!Array.isArray(input)) {
    return null;
  }

  const normalizedGroups = input
    .map((group) => {
      if (!group || typeof group !== 'object') {
        return null;
      }

      const rawItems = Array.isArray(group.items) ? group.items : [];

      return {
        id: typeof group.id === 'string' ? group.id : createId(),
        name:
          typeof group.name === 'string' && group.name.trim()
            ? group.name.trim().toUpperCase()
            : 'UNTITLED',
        collapsed: Boolean(group.collapsed),
        items: rawItems
          .map((item) => {
            if (!item || typeof item !== 'object' || typeof item.url !== 'string') {
              return null;
            }

            return {
              id: typeof item.id === 'string' ? item.id : createId(),
              title:
                typeof item.title === 'string' && item.title.trim()
                  ? item.title.trim()
                  : item.url,
              url: item.url,
            };
          })
          .filter(Boolean),
      };
    })
    .filter(Boolean);

  return normalizedGroups;
}

export async function loadGroups() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const storedGroups = result[STORAGE_KEY];
  const normalizedGroups = normalizeStoredGroups(storedGroups);

  if (normalizedGroups) {
    await saveGroups(normalizedGroups);
    return normalizedGroups;
  }

  await saveGroups(DEFAULT_GROUPS);
  return DEFAULT_GROUPS;
}

export async function saveGroups(groups) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: groups,
  });
}

export function createEmptyGroup(name) {
  return {
    id: createId(),
    name: name.trim().toUpperCase(),
    collapsed: false,
    items: [],
  };
}
