import React from "react";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useNavigate } from "@webiny/react-router";
import { HigherOrderComponent } from "@webiny/app-admin";
import { ButtonIcon, ButtonPrimary, IconButton } from "@webiny/ui/Button";
import { MenuItem } from "@webiny/ui/Menu";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as AddTaskIcon } from "~/assets/icons/add_task.svg";
import { useContentReviewId } from "./useContentReviewId";
import { routePaths } from "~/utils";

// TODO: Fix this import so that we can import it from root level maybe
import { PublishRevisionProps } from "@webiny/app-page-builder/admin/plugins/pageDetails/header/publishRevision/PublishRevision";
import { PublishPageMenuOptionProps } from "@webiny/app-page-builder/admin/plugins/pageDetails/pageRevisions/PublishPageMenuOption";
import { PublishPageButtonProps } from "@webiny/app-page-builder/editor/plugins/defaultBar/components/PublishPageButton";
import { PageRevisionListItemGraphicProps } from "@webiny/app-page-builder/admin/plugins/pageDetails/pageRevisions/PageRevisionListItemGraphic";

const t = i18n.ns("app-apw/page-builder/publish-page");

export const PublishRevisionHoc: HigherOrderComponent<PublishRevisionProps> = OriginalRenderer => {
    return function PageReview(props) {
        const contentReviewId = useContentReviewId(props.page.id);
        const navigate = useNavigate();

        if (!contentReviewId) {
            return <OriginalRenderer {...props} />;
        }

        return (
            <Tooltip content={t`Page review`} placement={"top"}>
                <IconButton
                    icon={<AddTaskIcon />}
                    onClick={() =>
                        navigate(
                            `${routePaths.CONTENT_REVIEWS}/${encodeURIComponent(contentReviewId)}`
                        )
                    }
                />
            </Tooltip>
        );
    };
};

export const PublishPageMenuOptionHoc: HigherOrderComponent<
    PublishPageMenuOptionProps
> = OriginalRenderer => {
    return function PageReview(props) {
        const contentReviewId = useContentReviewId(props.revision.id);
        const navigate = useNavigate();

        if (props.revision.status === "published") {
            return null;
        }

        if (!contentReviewId) {
            return <OriginalRenderer {...props} />;
        }

        return (
            <MenuItem
                onClick={() =>
                    navigate(`${routePaths.CONTENT_REVIEWS}/${encodeURIComponent(contentReviewId)}`)
                }
            >
                <ListItemGraphic>
                    <Icon icon={<AddTaskIcon />} />
                </ListItemGraphic>
                {t`Page review`}
            </MenuItem>
        );
    };
};

export const PublishPageButtonHoc: HigherOrderComponent<
    PublishPageButtonProps
> = OriginalRenderer => {
    return function PageReview(props) {
        const contentReviewId = useContentReviewId(props.page.id as string);
        const navigate = useNavigate();

        if (!contentReviewId) {
            return <OriginalRenderer {...props} />;
        }

        return (
            <ButtonPrimary
                onClick={() =>
                    navigate(`${routePaths.CONTENT_REVIEWS}/${encodeURIComponent(contentReviewId)}`)
                }
            >
                <ButtonIcon icon={<AddTaskIcon />} />
                {t`Page Review`}
            </ButtonPrimary>
        );
    };
};

export const PageRequestReviewHoc: HigherOrderComponent = () => {
    return function PageReview() {
        return null;
    };
};

export const PageRequestChangesHoc: HigherOrderComponent = () => {
    return function PageReview() {
        return null;
    };
};

export const PageRevisionListItemGraphicHoc: HigherOrderComponent<
    PageRevisionListItemGraphicProps
> = OriginalRenderer => {
    return function PageReview(props) {
        const contentReviewId = useContentReviewId(props.revision.id);

        if (contentReviewId && props.revision.status === "draft") {
            return (
                <ListItemGraphic>
                    <Tooltip content={t`Under Review`} placement={"bottom"}>
                        <AddTaskIcon />
                    </Tooltip>
                </ListItemGraphic>
            );
        }

        return <OriginalRenderer {...props} />;
    };
};
