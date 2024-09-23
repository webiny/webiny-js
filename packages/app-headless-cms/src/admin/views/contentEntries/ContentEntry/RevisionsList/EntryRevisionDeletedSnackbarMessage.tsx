import React from "react";
import { CmsContentEntry, CmsContentEntryRevision } from "@webiny/app-headless-cms-common/types";

interface RevisionDeletedSnackbarMessageProps {
    deletedRevision: CmsContentEntry;
    newLatestRevision?: CmsContentEntryRevision;
}

export const EntryRevisionDeletedSnackbarMessage = ({
    deletedRevision,
    newLatestRevision
}: RevisionDeletedSnackbarMessageProps) => {
    if (newLatestRevision) {
        return (
            <span>
                Successfully deleted revision <strong>#{deletedRevision.meta.version}</strong>.
                Redirecting to revision <strong>#{newLatestRevision.meta.version}</strong>...
            </span>
        );
    }

    return (
        <span>
            Successfully deleted last revision <strong>#{deletedRevision.meta.version}</strong>.
            Redirecting to list of entries...
        </span>
    );
};
