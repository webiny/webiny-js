import React from "react";
import usePermission from "~/admin/hooks/usePermission";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/menus");

const ContentModelMenuSection = ({ Section, Item }) => {
    const { canCreate } = usePermission();

    const canCreateContentModels = canCreate("cms.contentModel");
    const canCreateContentModelGroups = canCreate("cms.contentModelGroup");

    // Don't show the section if the user doesn't have the "write" access for both "cms.contentModel" and "cms.contentModelGroup".
    if (!canCreateContentModels && !canCreateContentModelGroups) {
        return null;
    }

    return (
        <Section label={t`Content Models`}>
            {canCreateContentModels && <Item label={t`Models`} path="/cms/content-models" />}

            {canCreateContentModelGroups && (
                <Item label={t`Groups`} path="/cms/content-model-groups" />
            )}
        </Section>
    );
};

export default ContentModelMenuSection;
