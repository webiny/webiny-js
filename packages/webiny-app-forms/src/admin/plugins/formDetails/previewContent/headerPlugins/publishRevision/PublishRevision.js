// @flow
import React from "react";
import { compose, withHandlers, withProps, withState } from "recompose";
import withPublishRevisionHandler from "../../../utils/withPublishRevisionHandler";
import { type WithFormDetailsProps } from "webiny-app-cms/admin/components";
import { IconButton } from "webiny-ui/Button";
import { Tooltip } from "webiny-ui/Tooltip";
import { ReactComponent as PublishIcon } from "webiny-app-cms/admin/assets/round-publish-24px.svg";
import { get } from "lodash";
import { withConfirmation, type WithConfirmationProps } from "webiny-ui/ConfirmationDialog";

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
    return revisions
        .filter(r => !r.published)
        .sort((a, b) => {
            return new Date(b.savedOn) - new Date(a.savedOn);
        });
}

type Props = WithFormDetailsProps & WithConfirmationProps;

const PublishRevision = ({ publishableRevisions, showConfirmation }: Props) => {
    if (!publishableRevisions.length) {
        return null;
    }

    return (
        <React.Fragment>
            <Tooltip content={"Publish"} placement={"top"}>
                <IconButton icon={<PublishIcon />} onClick={showConfirmation} />
            </Tooltip>
        </React.Fragment>
    );
};

export default compose(
    withProps(({ form }) => {
        const publishableRevisions = getPublishableRevisions(get(form, "revisions") || []);
        return {
            publishableRevisions,
            publishSuggestion: getPublishSuggestion(form, publishableRevisions)
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
    }),
    withConfirmation(({ form }) => ({
        title: "Publish revision",
        message: <p>You are about to publish this revision. Are your sure you want to continue?</p>
    }))
)(PublishRevision);
