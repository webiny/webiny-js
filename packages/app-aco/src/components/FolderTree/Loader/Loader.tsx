import React from "react";
import { Skeleton } from "@webiny/admin-ui";

interface LoaderProps {
    count?: number;
}

export const Loader = ({ count = 4 }: LoaderProps) => {
    const lines = Array.from({ length: count });

    return (
        <div className={"my-md p-xs"}>
            {lines.map((_, index) => {
                return (
                    <div key={`folder-skeleton-${index}`} className={"mb-xs px-sm py-xs-plus"}>
                        <Skeleton type={"text"} size={"md"} />
                    </div>
                );
            })}
        </div>
    );
};
