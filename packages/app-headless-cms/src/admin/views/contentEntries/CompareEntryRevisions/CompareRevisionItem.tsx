import React from "react";
import { Checkbox } from "@webiny/admin-ui";
import { useCompareEntryRevisions } from "./useCompareEntryRevisions.js";
import type { CmsContentEntryRevision } from "~/types.js";

interface CompareRevisionItemProps {
    revision: CmsContentEntryRevision;
}

export const CompareRevisionItem = ({ revision }: CompareRevisionItemProps) => {
    const { selectedRevisions, setSelectedRevisions } = useCompareEntryRevisions();

    const isSelected = selectedRevisions.some(selected => selected.id === revision.id);
    const isDisabled = selectedRevisions.length >= 2 && !isSelected;

    const handleToggle = (checked: boolean) => {
        if (checked) {
            if (selectedRevisions.length < 2) {
                setSelectedRevisions([...selectedRevisions, revision]);
            }
        } else {
            setSelectedRevisions(selectedRevisions.filter(selected => selected.id !== revision.id));
        }
    };

    return (
        <div className={"wby-flex wby-items-center wby-justify-center"}>
            <Checkbox
                checked={isSelected}
                onChange={handleToggle}
                disabled={isDisabled}
                data-testid={`cms.compare-revisions.select-${revision.id}`}
            />
        </div>
    );
};
