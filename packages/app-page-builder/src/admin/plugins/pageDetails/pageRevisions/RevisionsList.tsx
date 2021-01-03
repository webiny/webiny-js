// @ts-nocheck
import React from "react";
import { css } from "emotion";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import Revision from "./Revision";

const listWrapper = css({
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
});

const RevisionsList = props => {
    const { page, getPageQuery } = props;
    const { revisions = [] } = page;

    return (
        <Elevation className={listWrapper} z={2}>
            <div style={{ position: "relative" }}>
                {getPageQuery.loading && <CircularProgress />}
                <List nonInteractive twoLine>
                    {revisions.map(revision => (
                        <Revision {...props} revision={revision} key={revision.id} />
                    ))}
                </List>
            </div>
        </Elevation>
    );
};

export default RevisionsList;
