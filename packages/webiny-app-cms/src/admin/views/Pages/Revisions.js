// @flow
import React from "react";
import { List } from "webiny-ui/List";
import Revision from "./Revision";

type RevisionsProps = {
    page: Object,
    revisions: Array<Object>
};

const Revisions = ({ revisions, page }: RevisionsProps) => {
    return (
        <List nonInteractive>
            {revisions.map(rev => (
                <Revision page={page} rev={rev} key={rev.id} />
            ))}
        </List>
    );
};

export default Revisions;
