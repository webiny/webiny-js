import React from "react";
import { css } from "emotion";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import RevisionListItem from "./RevisionListItem";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

const style = {
    list: css({
        position: "relative",
        margin: 25,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        maxHeight: "calc(100vh - 160px)",
        ".mdc-deprecated-list .mdc-deprecated-list-item": {
            borderBottom: "1px solid var(--mdc-theme-on-background)"
        },
        ".mdc-deprecated-list .mdc-deprecated-list-item:last-child": {
            borderBottom: "none"
        }
    }),
    nothingToShow: css({
        padding: 20,
        margin: 25,
        textAlign: "center"
    })
};

export const RevisionsList = () => {
    const { entry, revisions, loading } = useContentEntry();

    return (
        <Elevation className={style.list} z={2}>
            {loading && <CircularProgress />}
            {entry.id && revisions.length ? (
                <List nonInteractive twoLine data-testid={"cms.content-form.revisions"}>
                    {revisions.map(revision => (
                        <RevisionListItem revision={revision} key={revision.id} />
                    ))}
                </List>
            ) : (
                <div className={style.nothingToShow}>{t`No revisions to show.`}</div>
            )}
        </Elevation>
    );
};
