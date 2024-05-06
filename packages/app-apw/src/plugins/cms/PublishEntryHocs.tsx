import React from "react";
import { useNavigate } from "@webiny/react-router";
import { HigherOrderComponent } from "@webiny/app-admin";
import { ButtonIcon, ButtonPrimary } from "@webiny/ui/Button";
import { ListItemGraphic } from "@webiny/ui/List";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as AddTaskIcon } from "~/assets/icons/add_task.svg";
import { useContentReviewId } from "./useContentReviewId";
import { routePaths } from "~/utils";
import { css } from "emotion";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/";

const t = i18n.ns("app-apw/cms/publish-entry");

const entryReviewClassName = css({
    marginLeft: 16
});

const { Actions, ContentEntry } = ContentEntryEditorConfig;

export const DecoratePublishEntryAction = Actions.ButtonAction.createDecorator(OriginalAction => {
    const EntryReviewButton = ({ children }: { children: JSX.Element }) => {
        const { entry, contentModel: model } = ContentEntry.useContentEntry();
        const contentReviewId = useContentReviewId(entry.id, model);
        const navigate = useNavigate();

        if (!contentReviewId) {
            return children;
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

    return function PublishEntryButton(props) {
        if (props.name === "publish" && props.element) {
            return (
                <OriginalAction
                    {...props}
                    element={<EntryReviewButton>{props.element}</EntryReviewButton>}
                />
            );
        }

        return <OriginalAction {...props} />;
    };
});

export const EntryRevisionListItem: HigherOrderComponent = OriginalRenderer => {
    return function EntryRevisionListItemGraphic() {
        const { entry, contentModel: model } = ContentEntry.useContentEntry();

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
