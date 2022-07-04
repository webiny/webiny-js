import { makeComposable } from "@webiny/react-composition";
import { ListItemGraphic } from "@webiny/ui/List";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as PublishIcon } from "~/admin/icons/publish.svg";
import React from "react";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/plugins/content-details/content-revisions");

const PublishEntryRevisionListItemComponent: React.FC = () => {
    return (
        <>
            <ListItemGraphic>
                <Icon icon={<PublishIcon />} />
            </ListItemGraphic>
            {t`Publish`}
        </>
    );
};

export const PublishEntryRevisionListItem = makeComposable(
    "PublishEntryRevisionListItem",
    PublishEntryRevisionListItemComponent
);
