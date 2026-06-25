import React from "react";
import type { ModelGroupDto } from "~/features/modelGroup/listModelGroups/abstractions.js";
import { AdminConfig, useRouter } from "@webiny/app-admin";
import { HasContentEntryPermissions } from "./HasContentEntryPermissions.js";
import { Routes } from "~/routes.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { normalizeIcon } from "~/utils/normalizeIcon.js";

const { Menu } = AdminConfig;

interface IGroupContentModelsProps {
    group: Pick<ModelGroupDto, "id" | "slug" | "contentModels">;
}

/**
 * Renders menu items for all content models within a group.
 * If the group has no content models, displays a "Nothing to show" message.
 * Wraps each content model menu item with permission checks.
 */
export const GroupContentModels = ({ group }: IGroupContentModelsProps) => {
    const router = useRouter();

    if (group.contentModels.length === 0) {
        return (
            <Menu
                parent="headlessCMSContent"
                name={`cms/group/${group.slug}-empty`}
                element={<Menu.Group text="Nothing to show" />}
            />
        );
    }

    return (
        <>
            {group.contentModels.map(contentModel => {
                const icon = normalizeIcon(contentModel.icon);

                return (
                    <HasContentEntryPermissions
                        key={contentModel.modelId}
                        group={group}
                        contentModel={contentModel}
                    >
                        <Menu
                            parent={`cms/group/${group.slug}`}
                            name={`cms/model/${contentModel.modelId}`}
                            element={
                                <Menu.Link
                                    pinnable={true}
                                    text={contentModel.name}
                                    to={router.getLink(Routes.ContentEntries.List, {
                                        modelId: contentModel.modelId
                                    })}
                                    pinnedIcon={
                                        icon ? (
                                            <Menu.Link.Icon
                                                label={contentModel.name}
                                                element={<FontAwesomeIcon icon={icon} />}
                                            />
                                        ) : undefined
                                    }
                                />
                            }
                        />
                    </HasContentEntryPermissions>
                );
            })}
        </>
    );
};
