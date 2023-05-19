import React, { ReactElement } from "react";
import ReactLoadingSkeleton, {
    SkeletonProps as BaseSkeletonProps,
    SkeletonTheme
} from "react-loading-skeleton";

import "react-loading-skeleton/dist/skeleton.css";

interface SkeletonProps extends BaseSkeletonProps {
    theme?: "dark" | "light";
}

export const Skeleton = ({ theme, ...props }: SkeletonProps): ReactElement => {
    return (
        <SkeletonTheme
            baseColor={
                theme === "dark" ? "var(--mdc-theme-on-background)" : "var(--mdc-theme-background)"
            }
            highlightColor={
                theme === "dark" ? "var(--mdc-theme-background)" : "var(--mdc-theme-surface)"
            }
        >
            <ReactLoadingSkeleton {...props} />
        </SkeletonTheme>
    );
};
