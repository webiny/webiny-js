import React from "react";
import { css } from "emotion";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import { PbPageDetailsContextValue } from "@webiny/app-page-builder/types";
import Revision from "./Revision";

const listWrapper = css({
    margin: 25,
    display: "flex",
    flexDirection: "column",
    overflow: "scroll",
    maxHeight: "calc(100vh - 160px)",
    ".mdc-list .mdc-list-item": {
        borderBottom: "1px solid var(--mdc-theme-on-background)"
    },
    ".mdc-list .mdc-list-item:last-child": {
        borderBottom: "none"
    }
});

type RevisionsListProps = {
    pageDetails: PbPageDetailsContextValue;
    loading: boolean;
};

const RevisionsList: React.FC<RevisionsListProps> = ({ pageDetails: { page }, loading }) => {
    return (
        <Elevation className={listWrapper} z={2}>
            <div style={{ position: "relative" }}>
                {loading && <CircularProgress />}
                <List nonInteractive twoLine>
                    {Array.isArray(page.revisions) &&
                        page.revisions.map(rev => <Revision rev={rev} key={rev.id} />)}
                </List>
            </div>
        </Elevation>
    );
};

export default RevisionsList;
