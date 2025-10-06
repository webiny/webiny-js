import React from "react";
import type { CmsGroup } from "~/types.js";
import { useRouter, AdminConfig } from "@webiny/app-admin";
import { HasContentEntryPermissions } from "./HasContentEntryPermissions.js";
import { Routes } from "~/routes.js";

const { Menu } = AdminConfig;

/**
 * Renders menu items for all content models within a group.
 * If the group has no content models, displays a "Nothing to show" message.
 * Wraps each content model menu item with permission checks.
 */
export const GroupContentModels = ({ group }: { group: CmsGroup }) => {
    const router = useRouter();

    if (group.contentModels.length === 0) {
        return (
            <Menu
                parent="headlessCMSContent"
                name={`${group.id}-empty`}
                element={<Menu.Group text="Nothing to show" />}
            />
        );
    }

    return (
        <>
            {group.contentModels.map(contentModel => (
                <HasContentEntryPermissions
                    key={contentModel.modelId}
                    group={group}
                    contentModel={contentModel}
                >
                    <Menu
                        parent={group.id}
                        name={contentModel.modelId}
                        element={
                            <Menu.Link
                                text={contentModel.name}
                                to={router.getLink(Routes.ContentEntries.List, {
                                    modelId: contentModel.modelId
                                })}
                            />
                        }
                    />
                </HasContentEntryPermissions>
            ))}
        </>
    );
};
