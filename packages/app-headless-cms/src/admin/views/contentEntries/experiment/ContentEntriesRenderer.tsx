import React, { Suspense, lazy } from "react";
import { CircularProgress } from "@webiny/ui/Progress";
import { HigherOrderComponent } from "@webiny/app-admin";

const ContentEntriesView = lazy(() => import("../ContentEntries"));

export const ContentEntriesRenderer: HigherOrderComponent = () => {
    return function ContentEntriesRenderer() {
        return (
            <Suspense fallback={<CircularProgress />}>
                <ContentEntriesView />
            </Suspense>
        );
    };
};
