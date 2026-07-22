import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as ExpandLessIcon } from "@webiny/icons/expand_less.svg";
import type { CommentsPresenter } from "../abstractions.js";
import { ThreadCard } from "./ThreadCard.js";
import { Composer } from "./Composer.js";
import type { CollabThread } from "~/types.js";
import "../styles.js";

interface Props {
    presenter: CommentsPresenter.Interface;
    onJumpToField: (locator: string) => void;
    resolveLabel: (locator: string) => string;
}

interface SectionProps {
    label: string;
    count: number;
    threads: CollabThread[];
    presenter: CommentsPresenter.Interface;
    onJumpToField: (locator: string) => void;
    defaultOpen?: boolean;
}

const CollapsibleSection = ({
    label,
    count,
    threads,
    presenter,
    onJumpToField,
    defaultOpen = true
}: SectionProps) => {
    const [open, setOpen] = useState(defaultOpen);
    if (count === 0) {
        return null;
    }
    return (
        <div className="wby-collab-group">
            <button className="wby-collab-section" onClick={() => setOpen(current => !current)}>
                {open ? <ExpandMoreIcon /> : <ExpandLessIcon />}
                <span className="wby-collab-section__label">
                    {label} · {count}
                </span>
            </button>
            {open
                ? threads.map(thread => (
                      <ThreadCard
                          key={thread.id}
                          presenter={presenter}
                          thread={thread}
                          onJumpToField={onJumpToField}
                      />
                  ))
                : null}
        </div>
    );
};

export const CommentsPanel = observer((props: Props) => {
    const { presenter, onJumpToField, resolveLabel } = props;
    const { vm } = presenter;

    const filter = vm.filterLocator;
    const matchesFilter = (thread: CollabThread) => !filter || thread.locator === filter;
    const openThreads = vm.threads.filter(matchesFilter);
    const outdatedThreads = vm.outdatedThreads.filter(matchesFilter);
    const resolvedThreads = vm.resolvedThreads.filter(matchesFilter);
    const total = openThreads.length + outdatedThreads.length + resolvedThreads.length;

    return (
        <aside className="wby-collab-panel">
            <div className="wby-collab-panel__header">
                <div className="wby-collab-panel__title">
                    <span className="wby-collab-panel__title-text">Comments</span>
                    <span className="wby-collab-count">{total}</span>
                </div>
                <div className="wby-collab-actions">
                    <button
                        className="wby-collab-iconbtn"
                        title="Close"
                        onClick={() => presenter.closePanel()}
                    >
                        <CloseIcon />
                    </button>
                </div>
            </div>

            {filter ? (
                <div className="wby-collab-filter">
                    <span className="wby-collab-filter__label">
                        Showing comments on <strong>{resolveLabel(filter)}</strong>
                    </span>
                    <button
                        className="wby-collab-filter__clear"
                        onClick={() => presenter.clearFieldFilter()}
                    >
                        Show all
                    </button>
                </div>
            ) : (
                <div className="wby-collab-overview">
                    <span className="wby-collab-overview__count">
                        <span className="wby-collab-dot" />
                        {vm.unresolvedCount} unresolved
                    </span>
                    <span className="wby-collab-overview__sep">·</span>
                    <span className="wby-collab-overview__fields">
                        across {vm.fieldCount} fields
                    </span>
                </div>
            )}

            <div className="wby-collab-list">
                {vm.error ? <div className="wby-collab-error">{vm.error}</div> : null}

                <Composer
                    presenter={presenter}
                    activeLocator={vm.activeLocator}
                    resolveLabel={resolveLabel}
                />

                {openThreads.map(thread => (
                    <ThreadCard
                        key={thread.id}
                        presenter={presenter}
                        thread={thread}
                        onJumpToField={onJumpToField}
                    />
                ))}

                {total === 0 && !vm.loading ? (
                    <div className="wby-collab-empty">
                        {filter
                            ? "No comments on this field yet. Add the first one above."
                            : "No comments yet. Add the first one above."}
                    </div>
                ) : null}

                <CollapsibleSection
                    label="Outdated"
                    count={outdatedThreads.length}
                    threads={outdatedThreads}
                    presenter={presenter}
                    onJumpToField={onJumpToField}
                />
                <CollapsibleSection
                    label="Resolved"
                    count={resolvedThreads.length}
                    threads={resolvedThreads}
                    presenter={presenter}
                    onJumpToField={onJumpToField}
                    defaultOpen={false}
                />
            </div>
        </aside>
    );
});
