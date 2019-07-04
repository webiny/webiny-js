// @flow
import React from "react";
import { List } from "webiny-ui/List";
import type { WithFormDetailsProps } from "webiny-app-cms/admin/components";
import Revision from "./Revision";
import { Elevation } from "webiny-ui/Elevation";
import { css } from "emotion";
import { CircularProgress } from "webiny-ui/Progress";

type RevisionsProps = WithFormDetailsProps;

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

const RevisionsList = ({ form, loading }: RevisionsProps) => {
    return (
        form && (
            <Elevation className={listWrapper} z={2}>
                <div style={{ position: "relative" }}>
                    {loading && <CircularProgress />}
                    <List nonInteractive twoLine>
                        {Array.isArray(form.revisions) &&
                            form.revisions.map(rev => (
                                <Revision form={form} revision={rev} key={rev.id} />
                            ))}
                    </List>
                </div>
            </Elevation>
        )
    );
};

export default RevisionsList;
