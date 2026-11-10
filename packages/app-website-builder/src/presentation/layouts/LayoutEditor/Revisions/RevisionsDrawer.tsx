import React from "react";
import { Drawer, List, OverlayLoader } from "@webiny/admin-ui";
import { createReactiveComponent, useHotkeys } from "@webiny/app-admin";
import { useLayoutRevisions } from "./useLayoutRevisions.js";
import { RevisionItem } from "./RevisionItem.js";

export const RevisionsDrawer = createReactiveComponent(() => {
    const presenter = useLayoutRevisions();
    const { revisions, loading, mutating, drawerOpen } = presenter.vm;

    useHotkeys({
        zIndex: 55,
        disabled: !drawerOpen,
        keys: {
            esc: () => presenter.openDrawer(false)
        }
    });

    return (
        <Drawer
            title={"Layout revisions"}
            open={drawerOpen}
            onOpenChange={open => presenter.openDrawer(open)}
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
            <div className={"relative"}>
                {loading || mutating ? <OverlayLoader /> : null}
                {revisions.length ? (
                    <List>
                        {revisions.map(item => (
                            <RevisionItem
                                key={item.revision.id}
                                presenter={presenter}
                                item={item}
                            />
                        ))}
                    </List>
                ) : (
                    <div className={"p-lg"}>No revisions to show.</div>
                )}
            </div>
        </Drawer>
    );
});
