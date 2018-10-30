import React from "react";
import { css } from "emotion";
import { withRouter, type WithRouterProps } from "webiny-app/components";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { Select } from "webiny-ui/Select";

const smallSelect = css({
    maxWidth: 200
});

type Props = WithPageDetailsProps & WithRouterProps;

const RevisionSelector = ({ router, pageDetails: { page } }: Props) => {
    return (
        <Select
            value={page.id}
            onChange={id => router.goToRoute({ params: { id } })}
            className={smallSelect}
        >
            {page.revisions.map(({ id, version }) => (
                <option key={id} value={id}>
                    Revision #{version}
                </option>
            ))}
        </Select>
    );
};

export default withRouter()(RevisionSelector);
