import React from "react";
import { i18n } from "@webiny/app/i18n";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "./../../viewsGraphql";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import get from "lodash.get";
const t = i18n.ns("app-headless-cms/admin/menus");
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";

const ContentModelMenuItems = function({ Section, Item }) {
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
                        label={contentModel.title}
                        path={`/cms/content-models/manage/${contentModel.id}`}
                    />
                ))}
            </Section>
        );
    });
};

export default ContentModelMenuItems;
