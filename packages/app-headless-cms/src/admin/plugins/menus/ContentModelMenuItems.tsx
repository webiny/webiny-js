import React from "react";
import get from "lodash.get";
import { i18n } from "@webiny/app/i18n";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "./../../viewsGraphql";

const t = i18n.ns("app-headless-cms/admin/menus");

const ContentModelMenuItems = ({ Section, Item }) => {
    const response = useQuery(LIST_MENU_CONTENT_GROUPS_MODELS);

    const { data } = get(response, "data.listContentModelGroups") || {};
    if (!data) {
        return null;
    }

    return data.map(contentModelGroup => {
        return (
            <Section
                key={contentModelGroup.id}
                name={`cms-content-models-${contentModelGroup.id}`}
                label={contentModelGroup.name}
                icon={
                    <FontAwesomeIcon
                        style={{ color: "var(--mdc-theme-text-secondary-on-background)" }}
                        icon={contentModelGroup.icon.split("/")}
                    />
                }
            >
                {contentModelGroup.contentModels.length === 0 && (
                    <Item style={{ opacity: 0.4 }} key={"empty-item"} label={t`Nothing to show.`} />
                )}
                {contentModelGroup.contentModels.map(contentModel => (
                    <Item
                        key={contentModel.id}
                        label={contentModel.name}
                        path={`/cms/content-models/manage/${contentModel.modelId}`}
                    />
                ))}
            </Section>
        );
    });
};

export default ContentModelMenuItems;
