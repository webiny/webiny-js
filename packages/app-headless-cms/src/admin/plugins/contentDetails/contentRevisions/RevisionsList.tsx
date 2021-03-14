import React from "react";
import { css } from "emotion";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorContentEntry, CmsEditorContentModel } from "~/types";
import Revision from "./Revision";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

const style = {
    list: css({
        position: "relative",
        margin: 25,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
        maxHeight: "calc(100vh - 160px)",
        ".mdc-list .mdc-list-item": {
            borderBottom: "1px solid var(--mdc-theme-on-background)"
        },
        ".mdc-list .mdc-list-item:last-child": {
            borderBottom: "none"
        }
    }),
    nothingToShow: css({
        padding: 20,
        margin: 25,
        textAlign: "center"
    })
};

export type Props = {
    setLoading: (loading: boolean) => void;
    getLoading: () => boolean;
    entry: CmsEditorContentEntry;
    revisions: CmsEditorContentEntry[];
    refetchContent: () => void;
    contentModel: CmsEditorContentModel;
    state: any;
    setState: (state: any) => void;
    switchTab: (index: number) => void;
    listQueryVariables: any;
};

const RevisionsList = (props: Props) => {
    const { entry, revisions } = props;

    return (
        <Elevation className={style.list} z={2}>
            {props.getLoading() && <CircularProgress />}
            {entry.id && revisions.length ? (
                <List nonInteractive twoLine>
                    {revisions.map(revision => (
                        <Revision {...props} revision={revision} key={revision.id} />
                    ))}
                </List>
            ) : (
                <div className={style.nothingToShow}>{t`No revisions to show.`}</div>
            )}
        </Elevation>
    );
};

export default RevisionsList;
