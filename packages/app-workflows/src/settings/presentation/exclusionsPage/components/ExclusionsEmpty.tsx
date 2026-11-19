import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import type { ExclusionsEmptyVm } from "~/settings/model/list/ExclusionsEmptyVm.js";
import { EXCLUSIONS_ADD_LABEL } from "../exclusionsCopy.js";
import { EXCLUSIONS_CLEAR_SEARCH_LABEL } from "../exclusionsCopy.js";

export interface ExclusionsEmptyProps {
    empty: ExclusionsEmptyVm;
    onAdd(): void;
    onClearSearch(): void;
}

// The empty states of R322: Add exclusion or Clear search when the VM says so.
export const ExclusionsEmpty = ({ empty, onAdd, onClearSearch }: ExclusionsEmptyProps) => {
    let actions: React.ReactNode = null;
    if (empty.showAdd) {
        actions = (
            <Button
                variant="primary"
                text={EXCLUSIONS_ADD_LABEL}
                icon={<AddIcon />}
                size="sm"
                onClick={() => onAdd()}
            />
        );
    }

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
