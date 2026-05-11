import React from "react";
import { List, OverlayLoader } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import RevisionListItem from "./RevisionListItem.js";
import type { CmsContentEntryRevision } from "@webiny/app-headless-cms-common/types/index.js";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

interface IRevisionsListProps {
    revisions: CmsContentEntryRevision[];
    loading: boolean;
}

export const RevisionsList = (props: IRevisionsListProps) => {
    const { revisions, loading } = props;

    return (
        <div className={"relative"}>
            {loading && <OverlayLoader />}
            {revisions?.length ? (
                <List data-testid={"cms.content-form.revisions"}>
                    {revisions.map(revision => (
                        <RevisionListItem revision={revision} key={revision.id} />
                    ))}
                </List>
            ) : (
                <div className={"p-lg"}>{t`No revisions to show.`}</div>
            )}
        </div>
    );
};
