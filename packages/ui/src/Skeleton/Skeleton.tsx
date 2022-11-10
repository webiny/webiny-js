import React, { ReactElement } from "react";
import ReactLoadingSkeleton, { SkeletonProps, SkeletonTheme } from "react-loading-skeleton";

import "react-loading-skeleton/dist/skeleton.css";

export const Skeleton = (props: SkeletonProps): ReactElement => {
    return (
        <SkeletonTheme
            baseColor={"var(--mdc-theme-background)"}
            highlightColor={"var(--mdc-theme-surface)"}
        >
            <ReactLoadingSkeleton {...props} />
        </SkeletonTheme>
    );
};
