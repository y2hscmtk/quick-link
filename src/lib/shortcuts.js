export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normalizeUrl(input) {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error('링크 주소를 입력해 주세요.');
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  const url = new URL(withProtocol);

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('http 또는 https 링크만 저장할 수 있습니다.');
  }

  return url.toString();
}

export function getHostnameLabel(input) {
  try {
    return new URL(input).hostname.replace(/^www\./, '');
  } catch {
    return input;
  }
}

export function buildShortcut(draft, currentId) {
  const normalizedUrl = normalizeUrl(draft.url);
  const trimmedTitle = draft.title.trim();

  return {
    id: currentId ?? createId(),
    title: trimmedTitle || getHostnameLabel(normalizedUrl),
    url: normalizedUrl,
  };
}

export async function openShortcut(url) {
  const normalizedUrl = normalizeUrl(url);
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (typeof activeTab?.id === 'number') {
    await chrome.tabs.update(activeTab.id, { url: normalizedUrl });
    return;
  }

  await chrome.tabs.create({ url: normalizedUrl });
}
