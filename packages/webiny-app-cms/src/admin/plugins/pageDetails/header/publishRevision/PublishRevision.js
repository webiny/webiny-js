// @flow
import React from "react";
import { compose, withHandlers, withProps, withState } from "recompose";
import withPublishRevisionHandler from "../../utils/withPublishRevisionHandler";
import PublishRevisionDialog from "./PublishRevisionDialog";
import { type WithPageDetailsProps } from "webiny-app-cms/admin/components";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { ReactComponent as PublishIcon } from "webiny-app-cms/admin/assets/round-publish-24px.svg";

function getPublishSuggestion(page, revisions) {
    if (!page.published) {
        return page.id;
    }

    if (revisions[0]) {
        return revisions[0].id;
    }

    return "";
}

function getPublishableRevisions(revisions) {
    return revisions.filter(r => !r.published).sort((a, b) => {
        return new Date(b.savedOn) - new Date(a.savedOn);
    });
}

type Props = WithPageDetailsProps;

const PublishRevision = ({
    openDialog,
    showDialog,
    hideDialog,
    publishRevision,
    publishableRevisions,
    publishSuggestion
}: Props) => {
    return (
        <React.Fragment>
            <Tooltip content={"Publish"} placement={"top"}>
                <IconButton icon={<PublishIcon />} onClick={showDialog} />
            </Tooltip>
            <PublishRevisionDialog
                open={openDialog}
                onClose={hideDialog}
                onSubmit={publishRevision}
                selected={publishSuggestion}
                revisions={publishableRevisions}
            />
        </React.Fragment>
    );
};

export default compose(
    withProps(({ pageDetails: { page } }) => {
        const publishableRevisions = getPublishableRevisions(page.revisions);
        return {
            publishableRevisions,
            publishSuggestion: getPublishSuggestion(page, publishableRevisions)
        };
    }),
    withPublishRevisionHandler("publish"),
    withState("openDialog", "setOpenDialog", false),
    withHandlers({
        showDialog: ({ setOpenDialog }) => () => setOpenDialog(true),
        hideDialog: ({ setOpenDialog }) => () => setOpenDialog(false)
    }),
    withHandlers({
        publishRevision: ({ publish, hideDialog }) => (revision: Object) => {
            hideDialog();
            publish(revision);
        }
    })
)(PublishRevision);
