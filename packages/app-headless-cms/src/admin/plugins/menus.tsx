import React from "react";
import { i18n } from "@webiny/app/i18n";
import { SecureView } from "@webiny/app-security/components";
import { MenuPlugin, MenuSettingsPlugin } from "@webiny/app-admin/types";
import { useQuery } from "react-apollo";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "./../viewsGraphql";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import EnvironmentSelector from "./menus/EnvironmentSelector";
import get from "lodash.get";
const t = i18n.ns("app-headless-cms/admin/menus");

const ContentModelMenuItems = function({ Menu, Item }) {
    const response = useQuery(LIST_MENU_CONTENT_GROUPS_MODELS);

    const { data } = get(response, "data.cms.listContentModelGroups") || {};
    if (!data) {
        return null;
    }

    return data.map(contentModelGroup => {
        return (
            <Menu
                key={contentModelGroup.id}
                name={`cms-content-models-${contentModelGroup.id}`}
                label={contentModelGroup.name}
                icon={<FontAwesomeIcon icon={contentModelGroup.icon.split("/")} size={"2x"} />}
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
            </Menu>
        );
    });
};

export default [
    {
        type: "menu-content-section",
        name: "menu-content-section-cms",
        render({ Section, Item }) {
            return (
                <SecureView
                    roles={{
                        contentModels: ["cms-content-models"],
                        contentModelGroups: ["cms-content-model-groups"],
                        environments: ["cms-content-environments"]
                    }}
                >
                    {({ roles }) => {
                        const { contentModels, contentModelGroups, environments } = roles;
                        if (!contentModels && !contentModelGroups && !environments) {
                            return null;
                        }

                        return (
                            <Section label={t`Headless CMS`}>
                                <EnvironmentSelector />
                                {contentModels && (
                                    <Item label={t`Content Models`} path="/cms/content-models" />
                                )}

                                {contentModelGroups && (
                                    <Item
                                        label={t`Content Model Groups`}
                                        path="/cms/content-model-groups"
                                    />
                                )}
                                {environments && (
                                    <Item label={t`Environments`} path="/cms/environments" />
                                )}
                            </Section>
                        );
                    }}
                </SecureView>
            );
        }
    } as MenuPlugin,
    {
        type: "menu",
        name: "menu-cms-content-models",
        render({ Menu, Item }) {
            return (
                <SecureView roles={["headless-cms-editors"]}>
                    <ContentModelMenuItems Menu={Menu} Item={Item} />
                </SecureView>
            );
        }
    } as MenuPlugin,
    {
        type: "menu-settings",
        name: "menu-settings-cms-environments",
        render({ Section, Item }) {
            return (
                <Section label={t`Headless CMS`}>
                    <Item label={t`Environments`} path={"/settings/cms/environments"} />
                    <Item label={t`Aliases`} path={"/settings/cms/environments/aliases"} />
                </Section>
            );
        }
    } as MenuSettingsPlugin
];
