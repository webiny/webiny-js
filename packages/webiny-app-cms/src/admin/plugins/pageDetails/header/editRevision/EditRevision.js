// @flow
import React from "react";
import { withRouter, type WithRouterProps } from "webiny-app/components";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { ReactComponent as EditIcon } from "webiny-app-cms/admin/assets/edit.svg";
import withRevisionHandlers from "../../pageRevisions/withRevisionHandlers";
import { compose } from "recompose";
import { createRevisionFrom } from "webiny-app-cms/admin/graphql/pages";
import { graphql } from "react-apollo";
import { withSnackbar, type WithSnackbarProps } from "webiny-admin/components";
import { get } from "lodash";
type Props = WithPageDetailsProps & WithRouterProps & { gqlCreate: Function } & WithSnackbarProps;

const EditRevision = ({ pageDetails: { page }, router, gqlCreate, showSnackbar }: Props) => {
    const unpublishedRevision = (get(page, "revisions") || []).find(
        item => !item.published && !item.locked
    );

    if (unpublishedRevision) {
        return (
            <Tooltip content={"Edit"} placement={"top"}>
                <IconButton
                    icon={<EditIcon />}
                    onClick={() =>
                        router.goToRoute({
                            name: "Cms.Editor",
                            params: { id: unpublishedRevision.id }
                        })
                    }
                />
            </Tooltip>
        );
    }

    return (
        <Tooltip content={"Edit"} placement={"top"}>
            <IconButton
                icon={<EditIcon />}
                onClick={async () => {
                    const [latestRevision] = page.revisions;
                    const { data: res } = await gqlCreate({
                        variables: { revision: latestRevision.id }
                    });
                    const { data, error } = res.cms.revision;

                    if (error) {
                        return showSnackbar(error.message);
                    }

                    router.goToRoute({
                        name: "Cms.Editor",
                        params: { id: data.id }
                    });
                }}
            />
        </Tooltip>
    );
};

export default compose(
    withSnackbar(),
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    withRouter(),
    withRevisionHandlers
)(EditRevision);
