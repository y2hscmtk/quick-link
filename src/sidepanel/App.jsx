import { useDeferredValue, useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FolderKanban,
  GripVertical,
  PencilLine,
  Plus,
  Search,
  Trash2,
  X,
} from './icons.jsx';
import { buildShortcut, getHostnameLabel, openShortcut } from '../lib/shortcuts.js';
import { createEmptyGroup, loadGroups, saveGroups, STORAGE_KEY } from '../lib/storage.js';

function joinClasses(...tokens) {
  return tokens.filter(Boolean).join(' ');
}

function getSearchableText(item, groupName = '') {
  return `${item.title} ${item.url} ${groupName}`.toLowerCase();
}

function getInitialLabel(item) {
  const hostInitial = getHostnameLabel(item.url).slice(0, 1).toUpperCase();
  return hostInitial || item.title.slice(0, 1).toUpperCase() || 'L';
}

function getDropPosition(event) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return event.clientY <= bounds.top + bounds.height / 2 ? 'before' : 'after';
}

function getDropPositionFromRect(clientY, bounds) {
  return clientY <= bounds.top + bounds.height / 2 ? 'before' : 'after';
}

function setDragPreview(event, selector) {
  const previewElement = event.currentTarget.closest(selector);

  if (!previewElement || typeof event.dataTransfer?.setDragImage !== 'function') {
    return;
  }

  const bounds = previewElement.getBoundingClientRect();
  const offsetX = Math.min(Math.max(event.clientX - bounds.left, 16), Math.max(bounds.width - 16, 16));
  const offsetY = Math.min(Math.max(event.clientY - bounds.top, 16), Math.max(bounds.height - 16, 16));

  event.dataTransfer.setDragImage(previewElement, offsetX, offsetY);
}

function reorderEntries(entries, sourceId, targetId, position) {
  if (sourceId === targetId) {
    return entries;
  }

  const sourceIndex = entries.findIndex((entry) => entry.id === sourceId);
  const targetIndex = entries.findIndex((entry) => entry.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return entries;
  }

  const nextEntries = [...entries];
  const [movedEntry] = nextEntries.splice(sourceIndex, 1);
  const targetIndexAfterRemoval = nextEntries.findIndex((entry) => entry.id === targetId);

  if (!movedEntry || targetIndexAfterRemoval < 0) {
    return entries;
  }

  const insertIndex = position === 'after' ? targetIndexAfterRemoval + 1 : targetIndexAfterRemoval;
  nextEntries.splice(insertIndex, 0, movedEntry);
  return nextEntries;
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
      setError(submitError instanceof Error ? submitError.message : 'Please check the form values.');
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
          <button className="mini-icon-button" type="button" onClick={onClose} aria-label="Close modal">
            <X size={14} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

function ShortcutCard({
  item,
  groupId,
  dragDisabled,
  dragState,
  dragTarget,
  onDelete,
  onEdit,
  onItemDragEnd,
  onItemDragOver,
  onItemDragStart,
  onItemDrop,
  onOpenItem,
}) {
  const isDragging = dragState?.type === 'item' && dragState.groupId === groupId && dragState.id === item.id;
  const dropPosition =
    dragTarget?.type === 'item' && dragTarget.groupId === groupId && dragTarget.id === item.id
      ? dragTarget.position
      : null;
  const handleLabel = dragDisabled ? 'Clear the search to reorder links' : 'Drag to reorder link';

  return (
    <article
      className={joinClasses(
        'link-card',
        isDragging && 'is-dragging',
        dropPosition && `is-drop-${dropPosition}`,
      )}
      role="link"
      tabIndex={0}
      onClick={() => {
        void onOpenItem(item);
      }}
      onDragOver={(event) => onItemDragOver(event, groupId, item.id)}
      onDrop={(event) => onItemDrop(event, groupId, item.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          void onOpenItem(item);
        }
      }}
    >
      <button
        className={joinClasses(
          'drag-handle-button',
          'drag-edge-button',
          isDragging && 'is-active',
          dragDisabled && 'is-disabled',
        )}
        type="button"
        draggable={!dragDisabled}
        onClick={(event) => event.stopPropagation()}
        onDragEnd={onItemDragEnd}
        onDragStart={(event) => onItemDragStart(event, groupId, item.id)}
        aria-label={handleLabel}
        title={handleLabel}
      >
        <GripVertical size={14} />
      </button>
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
          aria-label="Edit link"
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
          aria-label="Delete link"
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
  dragDisabled,
  dragState,
  dragTarget,
  group,
  items,
  onDeleteGroup,
  onDeleteItem,
  onGroupPointerStart,
  onItemDragEnd,
  onItemDragOver,
  onItemDragStart,
  onItemDrop,
  onOpenItem,
  onRenameGroup,
  onRequestAddItem,
  onRequestEditItem,
  onToggleGroup,
  searchActive,
}) {
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(group.name);
  const expanded = searchActive || !group.collapsed;
  const isDraggingGroup = dragState?.type === 'group' && dragState.id === group.id;
  const groupDropPosition =
    dragTarget?.type === 'group' && dragTarget.id === group.id ? dragTarget.position : null;
  const groupHandleLabel = dragDisabled ? 'Clear the search to reorder groups' : 'Drag to reorder group';

  useEffect(() => {
    setNameDraft(group.name);
  }, [group.name]);

  return (
    <section
      className={joinClasses(
        'group-section',
        isDraggingGroup && 'is-dragging',
        groupDropPosition && `is-drop-${groupDropPosition}`,
      )}
      data-group-drop-id={group.id}
    >
      <div className="group-row">
        <button
          className={joinClasses(
            'drag-handle-button',
            'drag-edge-button',
            isDraggingGroup && 'is-active',
            dragDisabled && 'is-disabled',
          )}
          type="button"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => onGroupPointerStart(event, group.id)}
          aria-label={groupHandleLabel}
          title={groupHandleLabel}
        >
          <GripVertical size={14} />
        </button>
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
            aria-label="Add link"
          >
            <Plus size={13} />
          </button>
          <button
            className="mini-icon-button"
            type="button"
            onClick={() => setRenaming((current) => !current)}
            aria-label="Rename group"
          >
            <PencilLine size={13} />
          </button>
          <button
            className="mini-icon-button"
            type="button"
            onClick={() => onDeleteGroup(group.id)}
            aria-label="Delete group"
          >
            <Trash2 size={13} />
          </button>
          <button
            className="mini-icon-button"
            type="button"
            onClick={() => onToggleGroup(group.id)}
            aria-label={expanded ? 'Collapse group' : 'Expand group'}
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
                dragDisabled={dragDisabled}
                dragState={dragState}
                dragTarget={dragTarget}
                onOpenItem={onOpenItem}
                onEdit={() => onRequestEditItem(group.id, item.id)}
                onDelete={() => onDeleteItem(group.id, item.id)}
                onItemDragEnd={onItemDragEnd}
                onItemDragOver={onItemDragOver}
                onItemDragStart={onItemDragStart}
                onItemDrop={onItemDrop}
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
  const [dragState, setDragState] = useState(null);
  const [dragTarget, setDragTarget] = useState(null);
  const [groupPointerDrag, setGroupPointerDrag] = useState(null);
  const searchInputRef = useRef(null);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const searchActive = Boolean(deferredQuery);
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

  useEffect(() => {
    if (!searchActive) {
      return;
    }

    setDragState(null);
    setDragTarget(null);
    setGroupPointerDrag(null);
  }, [searchActive]);

  const clearDragState = () => {
    setDragState(null);
    setDragTarget(null);
    setGroupPointerDrag(null);
  };

  const getGroupDropTarget = (clientX, clientY, sourceGroupId) => {
    if (typeof document === 'undefined') {
      return null;
    }

    const element = document.elementFromPoint(clientX, clientY);
    const dropZone = element?.closest?.('[data-group-drop-id]');
    const targetGroupId = dropZone?.getAttribute?.('data-group-drop-id');

    if (!targetGroupId || targetGroupId === sourceGroupId) {
      return null;
    }

    const bounds = dropZone.getBoundingClientRect();
    return {
      id: targetGroupId,
      position: getDropPositionFromRect(clientY, bounds),
    };
  };

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

    const confirmed = window.confirm(`Delete the "${targetGroup.name}" group?`);

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

  const handleMoveGroup = (sourceGroupId, targetGroupId, position) => {
    setGroups((current) => reorderEntries(current, sourceGroupId, targetGroupId, position));
    clearDragState();
  };

  const handleMoveItem = (groupId, sourceItemId, targetItemId, position) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) {
          return group;
        }

        const nextItems = reorderEntries(group.items, sourceItemId, targetItemId, position);
        return nextItems === group.items ? group : { ...group, items: nextItems };
      }),
    );
    clearDragState();
  };

  useEffect(() => {
    if (!groupPointerDrag) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      setGroupPointerDrag((current) =>
        current
          ? {
              ...current,
              x: event.clientX,
              y: event.clientY,
            }
          : current,
      );

      const nextTarget = getGroupDropTarget(event.clientX, event.clientY, groupPointerDrag.id);
      setDragTarget(nextTarget ? { type: 'group', ...nextTarget } : null);
    };

    const handlePointerEnd = (event) => {
      const nextTarget = getGroupDropTarget(event.clientX, event.clientY, groupPointerDrag.id);

      if (nextTarget) {
        handleMoveGroup(groupPointerDrag.id, nextTarget.id, nextTarget.position);
        return;
      }

      clearDragState();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerEnd);
      window.removeEventListener('pointercancel', handlePointerEnd);
    };
  }, [groupPointerDrag?.id]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return undefined;
    }

    document.body.classList.toggle('is-group-sorting', Boolean(groupPointerDrag));

    return () => {
      document.body.classList.remove('is-group-sorting');
    };
  }, [Boolean(groupPointerDrag)]);

  const handleGroupPointerStart = (event, groupId) => {
    if (searchActive || event.button !== 0) {
      return;
    }

    const activeGroup = groups.find((group) => group.id === groupId);

    if (!activeGroup) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setDragState({ type: 'group', id: groupId });
    setDragTarget(null);
    setGroupPointerDrag({
      id: groupId,
      name: activeGroup.name,
      count: activeGroup.items.length,
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleItemDragStart = (event, groupId, itemId) => {
    if (searchActive) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', itemId);
    setDragPreview(event, '.link-card');
    setDragState({ type: 'item', groupId, id: itemId });
    setDragTarget(null);
  };

  const handleItemDragOver = (event, groupId, itemId) => {
    if (dragState?.type !== 'item' || dragState.groupId !== groupId) {
      return;
    }

    event.preventDefault();

    if (dragState.id === itemId) {
      setDragTarget(null);
      return;
    }

    const position = getDropPosition(event);
    event.dataTransfer.dropEffect = 'move';
    setDragTarget((current) =>
      current?.type === 'item' &&
      current.groupId === groupId &&
      current.id === itemId &&
      current.position === position
        ? current
        : { type: 'item', groupId, id: itemId, position },
    );
  };

  const handleItemDrop = (event, groupId, itemId) => {
    if (dragState?.type !== 'item' || dragState.groupId !== groupId) {
      return;
    }

    event.preventDefault();
    handleMoveItem(groupId, dragState.id, itemId, getDropPosition(event));
  };

  const handleOpenItem = async (item) => {
    try {
      await openShortcut(item.url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not open the link.');
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
          <span className="brand-title">Quick Link</span>
        </div>
        <div className="panel-header-actions">
          <button
            className="header-icon-button"
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            aria-label="Focus search"
          >
            <Search size={15} />
          </button>
          <button
            className="header-icon-button is-primary"
            type="button"
            onClick={() => setDialog({ type: 'createGroup' })}
            aria-label="Create group"
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
              dragDisabled={searchActive}
              dragState={dragState}
              dragTarget={dragTarget}
              searchActive={searchActive}
              onToggleGroup={handleToggleGroup}
              onRenameGroup={handleRenameGroup}
              onDeleteGroup={handleDeleteGroup}
              onDeleteItem={handleDeleteItem}
              onRequestAddItem={(groupId) => setDialog({ type: 'createLink', groupId })}
              onRequestEditItem={(groupId, itemId) => setDialog({ type: 'editLink', groupId, itemId })}
              onOpenItem={handleOpenItem}
              onGroupPointerStart={handleGroupPointerStart}
              onItemDragEnd={clearDragState}
              onItemDragOver={handleItemDragOver}
              onItemDragStart={handleItemDragStart}
              onItemDrop={handleItemDrop}
            />
          ))
        )}
      </section>

      {groupPointerDrag ? (
        <div
          className="group-drag-overlay"
          style={{
            transform: `translate(${groupPointerDrag.x + 16}px, ${groupPointerDrag.y + 16}px)`,
          }}
        >
          <div className="group-drag-preview">
            <GripVertical size={14} />
            <FolderKanban size={14} />
            <span className="group-drag-preview-name">{groupPointerDrag.name}</span>
            <span className="group-badge">{groupPointerDrag.count}</span>
          </div>
        </div>
      ) : null}

      <footer className="panel-footer">
        <span>Quick Link</span>
        <span>v{appVersion}</span>
      </footer>

      {dialog?.type === 'createGroup' ? (
        <ModalShell title="Create group" onClose={() => setDialog(null)}>
          <GroupForm
            initialValue=""
            submitLabel="Create"
            onCancel={() => setDialog(null)}
            onSubmit={handleCreateGroup}
          />
        </ModalShell>
      ) : null}

      {dialog?.type === 'createLink' && activeGroup ? (
        <ModalShell title="Add link" onClose={() => setDialog(null)}>
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
        <ModalShell title="Edit link" onClose={() => setDialog(null)}>
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
