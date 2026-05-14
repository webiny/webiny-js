import React from "react";
import { useHotkeys } from "@webiny/app-admin";
import { RevisionsList } from "~/admin/views/contentEntries/ContentEntry/RevisionsList/RevisionsList.js";
import { useFullScreenContentEntry } from "../useFullScreenContentEntry.js";
import { Drawer } from "@webiny/admin-ui";
import { useContentEntry } from "~/admin/views/contentEntries/hooks/index.js";

export const RevisionListDrawer = () => {
    const { isRevisionListOpen, openRevisionList } = useFullScreenContentEntry();
    const { revisions, loading } = useContentEntry();

    useHotkeys({
        zIndex: 55,
        disabled: !isRevisionListOpen,
        keys: {
            esc: () => openRevisionList(false)
        }
    });

    return (
        <Drawer
            title={"Entry revisions"}
            open={isRevisionListOpen}
            onOpenChange={open => openRevisionList(open)}
            modal
            bodyPadding={false}
            headerSeparator={true}
            width={1000}
        >
            <RevisionsList revisions={revisions} loading={loading} />
        </Drawer>
    );
};
