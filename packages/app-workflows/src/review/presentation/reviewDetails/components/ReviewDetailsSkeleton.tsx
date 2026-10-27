import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const ROWS = [0, 1, 2];

// The loading body of the drawer: three timeline rows of a circle and two bars (design).
export const ReviewDetailsSkeleton = () => {
    return (
        <div className={"flex flex-col gap-lg"}>
            {ROWS.map(row => (
                <div key={row} className={"grid grid-cols-[32px_minmax(0,1fr)] gap-md"}>
                    <Skeleton type={"text"} className={"h-[32px] w-[32px] rounded-full"} />
                    <div className={"flex flex-col gap-sm pt-xs"}>
                        <Skeleton type={"text"} className={"w-[45%]"} />
                        <Skeleton type={"text"} className={"w-[70%]"} />
                    </div>
                </div>
            ))}
        </div>
    );
};
