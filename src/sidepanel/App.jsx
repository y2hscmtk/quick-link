import { useDeferredValue, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderKanban,
  PencilLine,
  Plus,
  Search,
  Trash2,
  X,
} from './icons.jsx';
import { buildShortcut, getHostnameLabel, openShortcut } from '../lib/shortcuts.js';
import { createEmptyGroup, loadGroups, saveGroups, STORAGE_KEY } from '../lib/storage.js';

function getSearchableText(item, groupName = '') {
  return `${item.title} ${item.url} ${groupName}`.toLowerCase();
}

function getInitialLabel(item) {
  const hostInitial = getHostnameLabel(item.url).slice(0, 1).toUpperCase();
  return hostInitial || item.title.slice(0, 1).toUpperCase() || 'L';
}

function ShortcutForm({ initialValue, submitLabel, onCancel, onSubmit }) {
  const [title, setTitle] = useState(initialValue.title);
  const [url, setUrl] = useState(initialValue.url);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(initialValue.title);
    setUrl(initialValue.url);
    setError('');
  }, [initialValue]);

  const handleSubmit = (event) => {
    event.preventDefault();

    try {
      onSubmit({ title, url });
      setError('');
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : '입력값을 다시 확인해 주세요.',
      );
    }
  };

  return (
    <form className="editor-card" onSubmit={handleSubmit}>
      <input
        className="field-input"
        type="text"
        placeholder="Link title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        autoFocus
      />
      <input
        className="field-input"
        type="text"
        placeholder="https://example.com"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="editor-actions">
        <button className="text-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="dark-button" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function GroupForm({ initialValue, submitLabel, onCancel, onSubmit }) {
  const [name, setName] = useState(initialValue);

  useEffect(() => {
    setName(initialValue);
  }, [initialValue]);

  return (
    <form
      className="editor-card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(name);
      }}
    >
      <input
        className="field-input"
        type="text"
        placeholder="New group"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoFocus
      />
      <div className="editor-actions">
        <button className="text-button" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="dark-button" type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function ModalShell({ title, subtitle, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="mini-icon-button" type="button" onClick={onClose} aria-label="닫기">
            <X size={14} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function ShortcutCard({ item, groupId, onOpenItem, onEdit, onDelete }) {
  return (
    <article
      className="link-card"
      role="link"
      tabIndex={0}
      onClick={() => {
        void onOpenItem(groupId, item);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          void onOpenItem(groupId, item);
        }
      }}
    >
      <div className="link-card-leading">
        <span className="link-icon">{getInitialLabel(item)}</span>
      </div>
      <div className="link-copy">
        <strong>{item.title}</strong>
        <small>{getHostnameLabel(item.url)}</small>
      </div>
      <div className="link-actions">
        <button
          className="mini-icon-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          aria-label="링크 수정"
        >
          <PencilLine size={13} />
        </button>
        <button
          className="mini-icon-button"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          aria-label="링크 삭제"
        >
          <Trash2 size={13} />
        </button>
        <span className="mini-icon-button static-icon" aria-hidden="true">
          <ExternalLink size={13} />
        </span>
      </div>
    </article>
  );
}

function GroupSection({
  group,
  items,
  searchActive,
  onToggleGroup,
  onRenameGroup,
  onDeleteGroup,
  onDeleteItem,
  onRequestAddItem,
  onRequestEditItem,
  onOpenItem,
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const expanded = searchActive || !group.collapsed;

  useEffect(() => {
    setNameDraft(group.name);
  }, [group.name]);

  return (
    <section className="group-section">
      <div className="group-row">
        <div className="group-label-button">
          <FolderKanban size={14} />
          {renaming ? (
            <form
              className="group-rename-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!nameDraft.trim()) {
                  setNameDraft(group.name);
                  setRenaming(false);
                  return;
                }

                onRenameGroup(group.id, nameDraft);
                setRenaming(false);
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <input
                className="group-rename-input"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                autoFocus
              />
            </form>
          ) : (
            <span className="group-name">{group.name}</span>
          )}
          <span className="group-badge">{items.length}</span>
        </div>
        <div className="group-row-actions">
          <button
            className="mini-icon-button"
            type="button"
            onClick={() => onRequestAddItem(group.id)}
            aria-label="링크 추가"
          >
            <Plus size={13} />
          </button>
          <button
            className="mini-icon-button"
            type="button"
            onClick={() => setRenaming((current) => !current)}
            aria-label="그룹 이름 수정"
          >
            <PencilLine size={13} />
          </button>
          <button
            className="mini-icon-button"
            type="button"
            onClick={() => onDeleteGroup(group.id)}
            aria-label="그룹 삭제"
          >
            <Trash2 size={13} />
          </button>
          <button
            className="mini-icon-button"
            type="button"
            onClick={() => onToggleGroup(group.id)}
            aria-label={expanded ? '그룹 접기' : '그룹 펼치기'}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="group-stack">
          {items.length ? (
            items.map((item) => (
              <ShortcutCard
                key={item.id}
                item={item}
                groupId={group.id}
                onOpenItem={onOpenItem}
                onEdit={() => onRequestEditItem(group.id, item.id)}
                onDelete={() => onDeleteItem(group.id, item.id)}
              />
            ))
          ) : (
            <div className="empty-block">
              <p>No links in this group yet.</p>
              <button
                className="text-button"
                type="button"
                onClick={() => onRequestAddItem(group.id)}
              >
                Add first link
              </button>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

export default function App() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState(null);
  const searchInputRef = useRef(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const appVersion = chrome.runtime?.getManifest?.().version ?? '0.1.0';

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const storedGroups = await loadGroups();

      if (!mounted) {
        return;
      }

      setGroups(storedGroups);
      setLoading(false);
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    void saveGroups(groups);
  }, [groups, loading]);

  useEffect(() => {
    const listener = (changes, area) => {
      if (area !== 'local' || !changes[STORAGE_KEY]) {
        return;
      }

      const nextValue = changes[STORAGE_KEY].newValue;

      if (Array.isArray(nextValue)) {
        setGroups(nextValue);
      }
    };

    chrome.storage.onChanged.addListener(listener);

    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    if (!dialog) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDialog(null);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [dialog]);

  const visibleGroups = groups
    .map((group) => {
      if (!deferredQuery) {
        return { group, items: group.items };
      }

      const groupMatches = group.name.toLowerCase().includes(deferredQuery);
      const matchingItems = group.items.filter((item) =>
        getSearchableText(item, group.name).includes(deferredQuery),
      );

      if (groupMatches) {
        return { group, items: group.items };
      }

      if (matchingItems.length) {
        return { group, items: matchingItems };
      }

      return null;
    })
    .filter(Boolean)
    .filter(({ group, items }) => {
      if (!deferredQuery) {
        return true;
      }

      return group.name.toLowerCase().includes(deferredQuery) || items.length > 0;
    });

  const handleCreateGroup = (name) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    setGroups((current) => [...current, createEmptyGroup(trimmedName)]);
    setDialog(null);
  };

  const handleRenameGroup = (groupId, name) => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      return;
    }

    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, name: trimmedName.toUpperCase() } : group,
      ),
    );
  };

  const handleDeleteGroup = (groupId) => {
    const targetGroup = groups.find((group) => group.id === groupId);

    if (!targetGroup) {
      return;
    }

    const confirmed = window.confirm(`"${targetGroup.name}" 그룹을 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    setGroups((current) => current.filter((group) => group.id !== groupId));
  };

  const handleToggleGroup = (groupId) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, collapsed: !group.collapsed } : group,
      ),
    );
  };

  const handleAddItem = (groupId, draft) => {
    const nextItem = buildShortcut(draft);

    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, collapsed: false, items: [...group.items, nextItem] } : group,
      ),
    );
  };

  const handleUpdateItem = (groupId, itemId, draft) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        return {
          ...group,
          items: group.items.map((item) => (item.id === itemId ? buildShortcut(draft, itemId) : item)),
        };
      }),
    );
  };

  const handleDeleteItem = (groupId, itemId) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? { ...group, items: group.items.filter((item) => item.id !== itemId) }
          : group,
      ),
    );
  };

  const handleOpenItem = async (_groupId, item) => {
    try {
      await openShortcut(item.url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '링크를 열지 못했습니다.');
    }
  };

  const isEmptyAll = !groups.length;
  const isEmptyFiltered = !visibleGroups.length;
  const activeGroup =
    dialog?.type === 'createLink' || dialog?.type === 'editLink'
      ? groups.find((group) => group.id === dialog.groupId) ?? null
      : null;
  const activeItem =
    dialog?.type === 'editLink' && activeGroup
      ? activeGroup.items.find((item) => item.id === dialog.itemId) ?? null
      : null;

  return (
    <main className="app-shell">
      <header className="panel-header">
        <div className="brand-copy">
          <span className="brand-title">Digital Curator</span>
        </div>
        <div className="panel-header-actions">
          <button
            className="header-icon-button"
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            aria-label="검색 포커스"
          >
            <Search size={15} />
          </button>
          <button
            className="header-icon-button is-primary"
            type="button"
            onClick={() => setDialog({ type: 'createGroup' })}
            aria-label="새 그룹"
          >
            <Plus size={15} />
          </button>
        </div>
      </header>

      <label className="search-shell">
        <Search size={15} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search bookmarks..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <section className="content-scroll">
        {loading ? (
          <div className="empty-block is-large">
            <p>Loading links...</p>
          </div>
        ) : isEmptyAll ? (
          <div className="empty-block is-large">
            <p>Start by creating your first group.</p>
            <button
              className="text-button"
              type="button"
              onClick={() => setDialog({ type: 'createGroup' })}
            >
              Create group
            </button>
          </div>
        ) : isEmptyFiltered ? (
          <div className="empty-block is-large">
            <p>No groups or links match your search.</p>
          </div>
        ) : (
          visibleGroups.map(({ group, items }) => (
            <GroupSection
              key={group.id}
              group={group}
              items={items}
              searchActive={Boolean(deferredQuery)}
              onToggleGroup={handleToggleGroup}
              onRenameGroup={handleRenameGroup}
              onDeleteGroup={handleDeleteGroup}
              onDeleteItem={handleDeleteItem}
              onRequestAddItem={(groupId) => setDialog({ type: 'createLink', groupId })}
              onRequestEditItem={(groupId, itemId) => setDialog({ type: 'editLink', groupId, itemId })}
              onOpenItem={handleOpenItem}
            />
          ))
        )}
      </section>

      <footer className="panel-footer">
        <span>Quick Link</span>
        <span>v{appVersion}</span>
      </footer>

      {dialog?.type === 'createGroup' ? (
        <ModalShell
          title="Create group"
          subtitle="새 그룹을 만들고 링크를 정리하세요."
          onClose={() => setDialog(null)}
        >
          <GroupForm
            initialValue=""
            submitLabel="Create"
            onCancel={() => setDialog(null)}
            onSubmit={handleCreateGroup}
          />
        </ModalShell>
      ) : null}

      {dialog?.type === 'createLink' && activeGroup ? (
        <ModalShell
          title="Add link"
          subtitle={`${activeGroup.name} 그룹에 새 링크를 추가합니다.`}
          onClose={() => setDialog(null)}
        >
          <ShortcutForm
            initialValue={{ title: '', url: '' }}
            submitLabel="Add link"
            onCancel={() => setDialog(null)}
            onSubmit={(draft) => {
              handleAddItem(activeGroup.id, draft);
              setDialog(null);
            }}
          />
        </ModalShell>
      ) : null}

      {dialog?.type === 'editLink' && activeGroup && activeItem ? (
        <ModalShell
          title="Edit link"
          subtitle={`${activeGroup.name} 그룹의 링크를 수정합니다.`}
          onClose={() => setDialog(null)}
        >
          <ShortcutForm
            initialValue={{ title: activeItem.title, url: activeItem.url }}
            submitLabel="Save"
            onCancel={() => setDialog(null)}
            onSubmit={(draft) => {
              handleUpdateItem(activeGroup.id, activeItem.id, draft);
              setDialog(null);
            }}
          />
        </ModalShell>
      ) : null}
    </main>
  );
}
