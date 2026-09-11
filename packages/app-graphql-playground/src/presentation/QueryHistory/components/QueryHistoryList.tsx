import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { HistoryEntryRow } from "./HistoryEntryRow.js";
import type { QueryHistoryPresenter } from "../abstractions.js";

interface QueryHistoryListProps {
    presenter: QueryHistoryPresenter.Interface;
    onRestore: (entry: QueryHistoryPresenter.EntryVm) => void;
    onOpenInNewTab: (entry: QueryHistoryPresenter.EntryVm) => void;
}

export const QueryHistoryList = observer((props: QueryHistoryListProps) => {
    const { presenter } = props;
    const { entries, searchQuery } = presenter.vm;

    return (
        <div>
            <div className="p-3 border-b border-neutral-dimmed">
                <input
                    type="text"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={ev => presenter.setSearchQuery(ev.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-neutral-muted rounded focus:outline-none focus:border-accent-default"
                />
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>
                {entries.length === 0 ? (
                    <div className="p-4 text-sm text-neutral-dimmed italic">
                        {searchQuery ? "No matching entries." : "No history yet."}
                    </div>
                ) : (
                    entries.map(entry => (
                        <HistoryEntryRow
                            key={entry.id}
                            entry={entry}
                            onRestore={props.onRestore}
                            onOpenInNewTab={props.onOpenInNewTab}
                            onRemove={id => presenter.remove(id)}
                        />
                    ))
                )}
            </div>
            {entries.length > 0 ? (
                <div className="p-3 border-t border-neutral-dimmed">
                    <Button onClick={() => presenter.clear()} variant="secondary" size="sm">
                        Clear All
                    </Button>
                </div>
            ) : null}
        </div>
    );
});
