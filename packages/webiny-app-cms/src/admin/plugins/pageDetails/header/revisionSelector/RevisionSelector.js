import React from "react";
import { css } from "emotion";
import { withRouter, type WithRouterProps } from "webiny-app/components";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { Select } from "webiny-ui/Select";

const smallSelect = css({
    maxWidth: 200
});

type Props = WithPageDetailsProps & WithRouterProps;

const RevisionSelector = ({ router, pageDetails: { revision, revisions } }: Props) => {
    return (
        <Select
            value={revision.data.id}
            onChange={id => router.goToRoute({ params: { revision: id }, merge: true })}
            className={smallSelect}
        >
            {revisions.data.map(({ id, name }) => (
                <option key={id} value={id}>
                    {name}
                </option>
            ))}
        </Select>
    );
};

export default withRouter()(RevisionSelector);
