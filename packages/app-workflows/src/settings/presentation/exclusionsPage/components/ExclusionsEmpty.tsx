import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import type { ExclusionsEmptyVm } from "~/settings/model/list/ExclusionsEmptyVm.js";
import { EXCLUSIONS_ADD_LABEL } from "../exclusionsCopy.js";

export interface ExclusionsEmptyProps {
    empty: ExclusionsEmptyVm;
    onAdd(): void;
}

// The empty states of R322: Add exclusion when the VM says so.
export const ExclusionsEmpty = ({ empty, onAdd }: ExclusionsEmptyProps) => {
    let actions: React.ReactNode = null;
    if (empty.showAdd) {
        actions = (
            <Button
                variant="primary"
                text={EXCLUSIONS_ADD_LABEL}
                icon={<PersonOffIcon />}
                onClick={() => onAdd()}
            />
        );
    }

    return (
        <div data-testid="exclusions-empty" className="flex flex-col items-center pt-xl">
            <EmptyState
                type="listing"
                title={empty.title}
                description={empty.text}
                actions={actions}
            />
        </div>
    );
};
