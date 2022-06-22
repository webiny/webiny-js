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
import { useContentEntry } from "@webiny/app-headless-cms/admin/views/contentEntries/hooks/useContentEntry";
import { css } from "emotion";

const t = i18n.ns("app-apw/cms/publish-entry");

const entryReviewClassName = css({
    marginLeft: 16
});

export const PublishEntryRevisionHoc: HigherOrderComponent = OriginalRenderer => {
    return function PublishRevision() {
        const { entry, contentModel: model } = useContentEntry();

        const contentReviewId = useContentReviewId(entry.id, model);
        const navigate = useNavigate();

        if (!contentReviewId) {
            return <OriginalRenderer />;
        }

        return (
            <Tooltip content={t`Entry review`} placement={"top"}>
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

export const PublishEntryMenuOptionHoc: HigherOrderComponent = OriginalRenderer => {
    return function PublishEntryMenuOption() {
        const { entry, contentModel: model } = useContentEntry();

        const contentReviewId = useContentReviewId(entry.id, model);
        const navigate = useNavigate();

        if (entry.status === "published") {
            return null;
        }

        if (!contentReviewId) {
            return <OriginalRenderer />;
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
                {t`Entry review`}
            </MenuItem>
        );
    };
};

export const PublishEntryButtonHoc: HigherOrderComponent = OriginalRenderer => {
    return function PublishEntryButton() {
        const { entry, contentModel: model } = useContentEntry();

        const contentReviewId = useContentReviewId(entry.id, model);
        const navigate = useNavigate();

        if (!contentReviewId) {
            return <OriginalRenderer />;
        }

        return (
            <ButtonPrimary
                className={entryReviewClassName}
                onClick={() =>
                    navigate(`${routePaths.CONTENT_REVIEWS}/${encodeURIComponent(contentReviewId)}`)
                }
            >
                <ButtonIcon icon={<AddTaskIcon />} />
                {t`Entry Review`}
            </ButtonPrimary>
        );
    };
};

export const EntryRequestReviewHoc: HigherOrderComponent = () => {
    return function EntryRequestReview() {
        return null;
    };
};

export const EntryRequestChangesHoc: HigherOrderComponent = () => {
    return function EntryRequestChanges() {
        return null;
    };
};

export const EntryRevisionListItemGraphicHoc: HigherOrderComponent = OriginalRenderer => {
    return function EntryRevisionListItemGraphic() {
        const { entry, contentModel: model } = useContentEntry();

        const contentReviewId = useContentReviewId(entry.id, model);

        if (contentReviewId && entry.meta.status === "draft") {
            return (
                <>
                    <ListItemGraphic>
                        <AddTaskIcon />
                    </ListItemGraphic>
                    {t`Entry Review`}
                </>
            );
        }

        return <OriginalRenderer />;
    };
};
