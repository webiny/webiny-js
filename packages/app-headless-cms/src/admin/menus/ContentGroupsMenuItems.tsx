import React from "react";
import get from "lodash/get";
import pluralize from "pluralize";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { LIST_MENU_CONTENT_GROUPS_MODELS } from "~/admin/viewsGraphql";
import useQuery from "~/admin/hooks/useQuery";
import usePermission, { ContentModel, ContentModelGroup } from "~/admin/hooks/usePermission";
import { AddMenu as Menu } from "@webiny/app-admin";
import { NothingToShow } from "./NothingToShowElement";

interface Props {
    group: ContentModelGroup;
    contentModel?: ContentModel;
    children: JSX.Element;
}

const HasContentEntryPermissions = ({ group, contentModel, children }: Props) => {
    const { canReadEntries } = usePermission();

    if (contentModel) {
        if (!canReadEntries({ contentModelGroup: group, contentModel })) {
            return null;
        }
    } else {
        const hasContentEntryPermission = group.contentModels.some(contentModel =>
            canReadEntries({
                contentModelGroup: group,
                contentModel
            })
        );

        if (group.contentModels.length > 0 && !hasContentEntryPermission) {
            return null;
        }
    }

    return children;
};

const Icon = ({ group }) => {
    return (
        <FontAwesomeIcon
            style={{ color: "var(--mdc-theme-text-secondary-on-background)" }}
            icon={group.icon.split("/")}
        />
    );
};

export const ContentGroupsMenuItems = () => {
    const response = useQuery(LIST_MENU_CONTENT_GROUPS_MODELS);
    const { data: groups } = get(response, "data.listContentModelGroups") || {};

    if (!groups) {
        return null;
    }

    return groups.map(group => {
        return (
            <HasContentEntryPermissions key={group.id} group={group}>
                <Menu
                    id={group.id}
                    label={group.name}
                    tags={["headlessCMS"]}
                    icon={<Icon group={group} />}
                >
                    {group.contentModels.length === 0 && (
                        <Menu id={`${group.id}-empty`} element={<NothingToShow />} />
                    )}
                    {group.contentModels.length > 0 &&
                        group.contentModels.map(contentModel => (
                            <HasContentEntryPermissions
                                key={contentModel.modelId}
                                group={group}
                                contentModel={contentModel}
                            >
                                <Menu
                                    id={contentModel.modelId}
                                    label={pluralize(contentModel.name)}
                                    path={`/cms/content-entries/${contentModel.modelId}`}
                                />
                            </HasContentEntryPermissions>
                        ))}
                </Menu>
            </HasContentEntryPermissions>
        );
    });
};
