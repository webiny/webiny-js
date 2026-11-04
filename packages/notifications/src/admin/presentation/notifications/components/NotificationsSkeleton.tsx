import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const ROWS = 4;

export const NotificationsSkeleton = () => {
    return (
        <div aria-busy="true" aria-label="Loading notifications">
            {Array.from({ length: ROWS }, (_, index) => (
                <div key={index} className="flex gap-sm-extra px-md py-sm-extra">
                    <div className="flex flex-1 flex-col gap-xs">
                        <Skeleton type={"text"} size={"md"} />
                        <Skeleton type={"text"} size={"md"} className={"w-3/4"} />
                        <div className="mt-xs flex items-center gap-xs">
                            <Skeleton type={"thumbnail"} size={"lg"} className={"rounded-full"} />
                            <Skeleton type={"text"} size={"sm"} className={"w-[96px]"} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
