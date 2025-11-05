import React from "react";
import { List, OverlayLoader } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import RevisionListItem from "./RevisionListItem.js";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry.js";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

export const RevisionsList = () => {
    const { entry, revisions, loading } = useContentEntry();

    return (
        <div className={"relative"}>
            {loading && <OverlayLoader />}
            {entry.id && revisions.length ? (
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
