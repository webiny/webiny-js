import React from "react";
import { Skeleton } from "@webiny/admin-ui";

interface IWorkflowStateListSkeletonProps {
    count?: number;
}

export const WorkflowStateListSkeleton = (props: IWorkflowStateListSkeletonProps) => {
    const { count = 3 } = props;

    return (
        <div className={"flex flex-col gap-xs p-lg"}>
            {Array.from({ length: count }).map((_, index) => {
                return (
                    <Skeleton
                        key={`workflow-state-skeleton-${index}`}
                        className={"h-[62px] w-full"}
                    />
                );
            })}
        </div>
    );
};
