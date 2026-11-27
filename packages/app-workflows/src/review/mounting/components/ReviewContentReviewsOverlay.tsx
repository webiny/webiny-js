import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { Heading } from "@webiny/admin-ui";
import { Scrollbar } from "@webiny/admin-ui";
import { OverlayLayout } from "@webiny/app-admin";
import { useRoute } from "@webiny/app-admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewListView } from "~/review/presentation/reviewList/components/ReviewListView.js";

export interface ReviewContentReviewsOverlayProps {
    app: WorkflowAppKind;
    rowProvider: IReviewRowProvider;
    // The namespaces the list follows live (one content model's, or the pages').
    namespaces: string[];
    // The content model every request is narrowed to (Headless CMS); none for Website Builder.
    fixedContentTypeId?: string | null;
    // The bar title, in the trash bin's style ("Content Reviews - Article", "Content Reviews - Pages").
    title: string;
    // Called once the overlay is closed: after its exit animation, or at once when the route changes.
    onClose: () => void;
}

/*
 * The overlay host of the Content Reviews list, over an app's list as the trash bin is: the same
 * list view as the page, scope All with every state, kept in memory and never in the URL (no
 * `onRouteChange`). Any route change ("Open content" of a row, or a link in the details drawer)
 * closes it, so what was opened shows; the list itself never changes the route.
 */
export const ReviewContentReviewsOverlay = (props: ReviewContentReviewsOverlayProps) => {
    const { app, rowProvider, namespaces, title, onClose } = props;
    const fixedContentTypeId = props.fixedContentTypeId ?? null;
    const { route } = useRoute();
    const routeKey = route ? `${route.pathname}${JSON.stringify(route.params ?? {})}` : "";
    const openedOn = useRef(routeKey);

    useEffect(() => {
        if (routeKey !== openedOn.current) {
            onClose();
        }
    }, [routeKey]);

    return (
        <OverlayLayout
            onExited={onClose}
            barLeft={
                <Heading level={5} className={"text-neutral-primary"}>
                    {title}
                </Heading>
            }
        >
            <Scrollbar>
                <ReviewListView
                    app={app}
                    rowProvider={rowProvider}
                    namespaces={namespaces}
                    showContentType={false}
                    contentTypeFilter={null}
                    fixedContentTypeId={fixedContentTypeId}
                    initialScope={"all"}
                    initialState={"all"}
                    title={null}
                />
            </Scrollbar>
        </OverlayLayout>
    );
};
