import React from "react";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useNavigate } from "@webiny/react-router";
import { ButtonIcon, ButtonPrimary, IconButton } from "@webiny/ui/Button";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { Components } from "@webiny/app-page-builder";
import { ReactComponent as AddTaskIcon } from "~/assets/icons/add_task.svg";
import { useContentReviewId } from "./useContentReviewId";
import { routePaths } from "~/utils";

const t = i18n.ns("app-apw/page-builder/publish-page");

const PublishRevisionDecorator = Components.PageDetails.Toolbar.PublishRevision.createDecorator(
    OriginalRenderer => {
        return function PageReview() {
            const { page } = Components.PageDetails.usePage();
            const contentReviewId = useContentReviewId(page.id);
            const navigate = useNavigate();

            if (!contentReviewId) {
                return <OriginalRenderer />;
            }

            return (
                <Tooltip content={t`Page review`} placement={"top"}>
                    <IconButton
                        icon={<AddTaskIcon />}
                        onClick={() =>
                            navigate(
                                `${routePaths.CONTENT_REVIEWS}/${encodeURIComponent(
                                    contentReviewId
                                )}`
                            )
                        }
                    />
                </Tooltip>
            );
        };
    }
);

const PublishPageMenuOptionDecorator =
    Components.PageDetails.Revisions.Actions.PublishRevision.createDecorator(OriginalRenderer => {
        return function PageReview(props) {
            const { revision } = Components.PageDetails.Revisions.useRevision();
            const contentReviewId = useContentReviewId(revision.id);
            const navigate = useNavigate();

            if (revision.status === "published") {
                return null;
            }

            if (!contentReviewId) {
                return <OriginalRenderer {...props} />;
            }

            return (
                <MenuItem
                    onClick={() =>
                        navigate(
                            `${routePaths.CONTENT_REVIEWS}/${encodeURIComponent(contentReviewId)}`
                        )
                    }
                >
                    <ListItemGraphic>
                        <Icon icon={<AddTaskIcon />} />
                    </ListItemGraphic>
                    {t`Page review`}
                </MenuItem>
            );
        };
    });

const PublishPageFromEditorDecorator = Components.PageEditor.Toolbar.PublishPage.createDecorator(
    OriginalRenderer => {
        return function PageReview() {
            const [page] = Components.PageEditor.usePage();
            const contentReviewId = useContentReviewId(page.id);
            const navigate = useNavigate();

            if (!contentReviewId) {
                return <OriginalRenderer />;
            }

            return (
                <ButtonPrimary
                    onClick={() =>
                        navigate(
                            `${routePaths.CONTENT_REVIEWS}/${encodeURIComponent(contentReviewId)}`
                        )
                    }
                >
                    <ButtonIcon icon={<AddTaskIcon />} />
                    {t`Page Review`}
                </ButtonPrimary>
            );
        };
    }
);
const PageRevisionListItemGraphicDecorator =
    Components.PageDetails.Revisions.ListItemGraphic.createDecorator(OriginalRenderer => {
        return function PageReview() {
            const { revision } = Components.PageDetails.Revisions.useRevision();
            const contentReviewId = useContentReviewId(revision.id);

            if (contentReviewId && revision.status === "draft") {
                return (
                    <ListItemGraphic>
                        <Tooltip content={t`Under Review`} placement={"bottom"}>
                            <AddTaskIcon />
                        </Tooltip>
                    </ListItemGraphic>
                );
            }

            return <OriginalRenderer />;
        };
    });

export const DecoratePagePublishActions = () => {
    return (
        <>
            <PublishRevisionDecorator />
            <PublishPageMenuOptionDecorator />
            <PublishPageFromEditorDecorator />
            <PageRevisionListItemGraphicDecorator />
        </>
    );
};
