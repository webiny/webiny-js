import React from "react";
import { List } from "@webiny/ui/List";
import Revision from "./Revision";
import { Elevation } from "@webiny/ui/Elevation";
import { css } from "emotion";
import { CircularProgress } from "@webiny/ui/Progress";

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

const RevisionsList = ({ form, revisions, loading }) => {
    return (
        form && (
            <Elevation className={listWrapper} z={2}>
                <div style={{ position: "relative" }}>
                    {loading && <CircularProgress />}
                    <List
                        nonInteractive
                        twoLine
                        data-testid={"fb.form-details.tab.revisions.content-list"}
                    >
                        {Array.isArray(revisions)
                            ? revisions.map(rev => (
                                  <Revision form={form} revision={rev} key={rev.id} />
                              ))
                            : null}
                    </List>
                </div>
            </Elevation>
        )
    );
};

export default RevisionsList;
