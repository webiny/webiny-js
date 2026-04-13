import React from "react";
import { useRoute, useRouter } from "@webiny/app-admin";
import { Button, DropdownMenu, Text } from "@webiny/admin-ui";
import { ReactComponent as DownButton } from "@webiny/icons/keyboard_arrow_down.svg";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/useContentEntry.js";
import { statuses as statusLabels } from "~/admin/constants.js";
import type { CmsContentEntryRevision } from "~/types.js";
import { Routes } from "~/routes.js";

interface CmsEntryRevision extends Pick<CmsContentEntryRevision, "id"> {
    meta: Pick<CmsContentEntryRevision["meta"], "version" | "status">;
}

const defaultRevisions: CmsEntryRevision[] = [
    {
        id: "new",
        meta: {
            version: 1,
            status: "draft"
        }
    }
];

export const RevisionSelector = () => {
    const { goToRoute } = useRouter();
    const { route } = useRoute(Routes.ContentEntries.List);

    const { entry, revisions, loading } = useContentEntry();

    const currentRevision = {
        version: entry?.meta?.version || 1,
        status: entry?.meta?.status || "draft"
    };

    const allRevisions = revisions.length ? revisions : defaultRevisions;

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
            {allRevisions.map(revision => (
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
                            <Text as={"div"}>v{revision.meta.version}</Text>
                            <Text size={"sm"}>({statusLabels[revision.meta.status]})</Text>
                        </>
                    }
                />
            ))}
        </DropdownMenu>
    );
};
