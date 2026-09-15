import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, EmptyState, IconButton } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import type { CommentsPresenter } from "../abstractions.js";
import { ThreadList } from "./ThreadList.js";
import { CollapsibleSection } from "./CollapsibleSection.js";
import { Composer } from "./Composer.js";
import type { CollabThread } from "~/admin/types.js";
import "../styles.js";

interface Props {
    presenter: CommentsPresenter.Interface;
    onJumpToField: (locator: string) => void;
    resolveLabel: (locator: string) => string;
}

export const CommentsPanel = createReactiveComponent((props: Props) => {
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
                    <IconButton
                        variant="ghost"
                        size="sm"
                        title="Refresh comments"
                        aria-label="Refresh comments"
                        disabled={vm.loading}
                        onClick={() => void presenter.reload()}
                        icon={
                            <RefreshIcon className={vm.loading ? "wby-collab-spin" : undefined} />
                        }
                    />
                    <IconButton
                        variant="ghost"
                        size="sm"
                        title="Close"
                        aria-label="Close"
                        onClick={() => presenter.closePanel()}
                        icon={<CloseIcon />}
                    />
                </div>
            </div>

            {filter ? (
                <div className="wby-collab-filter">
                    <span className="wby-collab-filter__label">
                        Showing comments on <strong>{resolveLabel(filter)}</strong>
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        text="Show all"
                        onClick={() => presenter.clearFieldFilter()}
                    />
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

                <ThreadList
                    threads={openThreads}
                    presenter={presenter}
                    onJumpToField={onJumpToField}
                />

                {total === 0 && !vm.loading ? (
                    <EmptyState
                        size="sm"
                        illustration={false}
                        description={
                            filter
                                ? "No comments on this field yet. Add the first one above."
                                : "No comments yet. Add the first one above."
                        }
                    />
                ) : null}

                <CollapsibleSection
                    label="Outdated"
                    threads={outdatedThreads}
                    presenter={presenter}
                    onJumpToField={onJumpToField}
                />
                <CollapsibleSection
                    label="Resolved"
                    threads={resolvedThreads}
                    presenter={presenter}
                    onJumpToField={onJumpToField}
                    defaultOpen={false}
                />
            </div>
        </aside>
    );
});
