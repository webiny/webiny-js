// @flow
import React from "react";
import { List } from "webiny-ui/List";
import Revision from "./Revision";

type RevisionsProps = {
    revisions: Array<Object>
};

const Revisions = ({ revisions }: RevisionsProps) => {
    return (
        <List nonInteractive>
            {revisions.map(rev => (
                <Revision rev={rev} key={rev.id} />
            ))}
        </List>
    );
};

export default Revisions;
