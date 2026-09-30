import React from "react";
import { useHotkeys } from "@webiny/app-admin";
import { RevisionsList } from "./RevisionsList.js";
import { Drawer } from "@webiny/admin-ui";
import type { Page } from "~/domain/Page/Page.js";
import { usePageEditorDrawer } from "./usePageEditorDrawer.js";

interface IRevisionListDrawerProps {
    page: Pick<Page, "id">;
}

export const RevisionListDrawer = (props: IRevisionListDrawerProps) => {
    const { page } = props;
    const { isRevisionListOpen, openRevisionList } = usePageEditorDrawer();

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
            onInteractOutside={e => {
                // Confirmation dialogs render above the drawer; clicking their overlay must not
                // close the drawer underneath them.
                const target = e.target as HTMLElement;
                if (target.closest("[data-role='dialog']")) {
                    e.preventDefault();
                }
            }}
            modal
            bodyPadding={false}
            headerSeparator={true}
            width={1000}
        >
            <RevisionsList page={page} />
        </Drawer>
    );
};
