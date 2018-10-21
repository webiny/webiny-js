// @flow
import React from "react";
import { List } from "webiny-ui/List";
import type { WithPageDetailsProps } from "webiny-app-cms/admin/components";
import Revision from "./Revision";
import { Elevation } from "webiny-ui/Elevation";
import { css } from "emotion";

type RevisionsProps = WithPageDetailsProps;

const listWrapper = css({
    margin: 25,
    ".mdc-list .mdc-list-item": {
        borderBottom: "1px solid var(--mdc-theme-on-background)"
    },
    ".mdc-list .mdc-list-item:last-child": {
        borderBottom: "none"
    }
});

const RevisionsList = ({ pageDetails: { revisions } }: RevisionsProps) => {
    if (revisions.loading) {
        return "Loading revisions...";
    }

    return (
        <Elevation className={listWrapper} z={2}>
            <List nonInteractive twoLine>
                {revisions.data.map(rev => (
                    <Revision rev={rev} key={rev.id} />
                ))}
            </List>
        </Elevation>
    );
};

export default RevisionsList;
