// @flow
import React from "react";
import { List } from "webiny-ui/List";
import type { WithPageDetailsProps } from "webiny-app-cms/admin/components";
import Revision from "./Revision";

type RevisionsProps = WithPageDetailsProps;

const RevisionsList = ({ pageDetails: { page } }: RevisionsProps) => {
    return (
        <List nonInteractive twoLine>
            {page.revisions.map(rev => (
                <Revision rev={rev} key={rev.id} />
            ))}
        </List>
    );
};

export default RevisionsList;
