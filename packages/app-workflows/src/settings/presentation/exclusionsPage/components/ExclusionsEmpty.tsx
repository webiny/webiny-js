import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import type { ExclusionsEmptyVm } from "~/settings/model/list/ExclusionsEmptyVm.js";
import { EXCLUSIONS_CLEAR_SEARCH_LABEL } from "../exclusionsCopy.js";

export interface ExclusionsEmptyProps {
    empty: ExclusionsEmptyVm;
    onClearSearch(): void;
}

// The empty states of R322: Clear search when the VM says so; Add exclusion is the toolbar's only.
export const ExclusionsEmpty = ({ empty, onClearSearch }: ExclusionsEmptyProps) => {
    let actions: React.ReactNode = null;
    if (empty.showClearSearch) {
        actions = (
            <Button
                variant="secondary"
                text={EXCLUSIONS_CLEAR_SEARCH_LABEL}
                size="sm"
                onClick={() => onClearSearch()}
            />
        );
    }

    return (
        <div data-testid="exclusions-empty" className="flex flex-col items-center pt-xl">
            <EmptyState
                type="table"
                size="sm"
                title={empty.title}
                description={empty.text ?? undefined}
                actions={actions}
            />
        </div>
    );
};
