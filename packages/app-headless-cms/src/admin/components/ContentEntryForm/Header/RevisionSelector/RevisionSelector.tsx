import React, { useCallback } from "react";
import { useRoute, useRouter } from "@webiny/app-admin";
import { Button, DropdownMenu, Text } from "@webiny/admin-ui";
import { ReactComponent as DownButton } from "@webiny/icons/keyboard_arrow_down.svg";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry.js";
import { statuses as statusLabels } from "~/admin/constants.js";
import { Routes } from "~/routes.js";
import { useFullScreenContentEntry } from "~/admin/views/contentEntries/ContentEntry/FullScreenContentEntry/useFullScreenContentEntry.js";

export const RevisionSelector = () => {
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);

    const { entry, revisions, loading } = useContentEntry();
    const { openRevisionList } = useFullScreenContentEntry();

    const showRevisionsDrawer = useCallback(() => {
        openRevisionList(true);
    }, []);

    const currentRevision = {
        version: entry.meta?.version || 1,
        status: entry.meta?.status || "draft"
    };

    if (!revisions.length) {
        return null;
    }

    const firstFiveRevisions = revisions.slice(0, 5);

    return (
        <DropdownMenu
            trigger={
                <Button
                    variant={"ghost"}
                    disabled={loading}
                    icon={<DownButton />}
                    iconPosition={"end"}
                    text={
                        <>
                            v{currentRevision.version} ({statusLabels[currentRevision.status]})
                        </>
                    }
                />
            }
        >
            {firstFiveRevisions.slice(0, 5).map(revision => (
                <DropdownMenu.Item
                    key={revision.id}
                    onClick={() => {
                        goToRoute(Routes.ContentEntries.List, {
                            ...route.params,
                            id: revision.id
                        });
                    }}
                    text={
                        <>
                            <Text size={"sm"}>
                                v{revision.meta.version} ({statusLabels[revision.meta.status]})
                            </Text>
                        </>
                    }
                />
            ))}
            {revisions.length > 5 ? (
                <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item
                        key={"revisions-all"}
                        onClick={showRevisionsDrawer}
                        text={
                            <>
                                <Text size={"sm"}>Show All Revisions</Text>
                            </>
                        }
                    />
                </>
            ) : null}
        </DropdownMenu>
    );
};
