import React from "react";
import { useState } from "react";
import { Sidebar } from "@webiny/admin-ui";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewContentReviewsOverlay } from "./ReviewContentReviewsOverlay.js";

export interface ReviewContentReviewsOverlaySidebarItemProps {
    app: WorkflowAppKind;
    rowProvider: IReviewRowProvider;
    namespaces: string[];
    // The content model the overlay lists the reviews of (Headless CMS); none for Website Builder.
    fixedContentTypeId?: string | null;
    // The overlay's bar title.
    title: string;
    icon: React.ReactElement;
}

/*
 * The "Content Reviews" item of an app's list sidebar (a content model's entries, the pages): it
 * opens the reviews in an overlay over the list, as the trash bin does, and leaves the URL alone.
 * Every opening starts a new list; closing it returns to the list as it was.
 */
export const ReviewContentReviewsOverlaySidebarItem = (
    props: ReviewContentReviewsOverlaySidebarItemProps
) => {
    const { app, rowProvider, namespaces, fixedContentTypeId, title, icon } = props;
    const [open, setOpen] = useState(false);

    let overlay: React.ReactNode = null;
    if (open) {
        overlay = (
            <ReviewContentReviewsOverlay
                app={app}
                rowProvider={rowProvider}
                namespaces={namespaces}
                fixedContentTypeId={fixedContentTypeId}
                title={title}
                onClose={() => setOpen(false)}
            />
        );
    }

    // The `list-none` wrapper of the trash bin item: the sidebar footer is no list.
    return (
        <div className={"list-none"}>
            <Sidebar.Item
                onClick={() => setOpen(true)}
                text={"Content Reviews"}
                icon={<Sidebar.Item.Icon element={icon} label={"Content Reviews"} />}
                badge={<Sidebar.Item.Badge text={"BETA"} />}
            />
            {overlay}
        </div>
    );
};
