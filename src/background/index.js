const panelStateByWindow = new Map();

async function ensurePanelBehavior() {
  if (!chrome.sidePanel?.setPanelBehavior) {
    return;
  }

  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  } catch (error) {
    console.warn('[react-sidepanel-starter] Failed to set side panel behaviour:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void ensurePanelBehavior();
});

void ensurePanelBehavior();

if (chrome.sidePanel?.onClosed) {
  chrome.sidePanel.onClosed.addListener(({ windowId }) => {
    if (typeof windowId === 'number') {
      panelStateByWindow.set(windowId, false);
    }
  });
}

chrome.action?.onClicked.addListener(async (tab) => {
  if (typeof tab?.windowId !== 'number' || !chrome.sidePanel?.open) {
    return;
  }

  const windowId = tab.windowId;
  const isOpen = panelStateByWindow.get(windowId) ?? false;

  try {
    if (isOpen && chrome.sidePanel?.close) {
      await chrome.sidePanel.close({ windowId });
      panelStateByWindow.set(windowId, false);
      return;
    }

    await chrome.sidePanel.open({ windowId });
    panelStateByWindow.set(windowId, true);
  } catch (error) {
    console.warn('[react-sidepanel-starter] Side panel toggle failed:', error);
  }
});
