import React from "react";
import { css } from "emotion";
import { List } from "@webiny/ui/List";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import Revision from "./Revision";
import get from "lodash/get";

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

const RevisionsList = props => {
    const { content, loading } = props;

    const revisions = get(content, "meta.revisions", []);

    return (
        <Elevation className={listWrapper} z={2}>
            <div style={{ position: "relative" }}>
                {loading && <CircularProgress />}
                <List nonInteractive twoLine>
                    {revisions.map(rev => (
                        <Revision {...props} key={rev.id} />
                    ))}
                </List>
            </div>
        </Elevation>
    );
};

export default RevisionsList;
