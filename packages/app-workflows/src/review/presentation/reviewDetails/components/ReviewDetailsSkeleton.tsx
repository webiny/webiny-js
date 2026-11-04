import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const ROWS = [0, 1, 2];

// The loading body of the drawer: three step rows.
export const ReviewDetailsSkeleton = () => {
    return (
        <div className={"flex flex-col gap-sm"}>
            {ROWS.map(row => (
                <Skeleton key={row} type={"text"} size={"xl"} />
            ))}
        </div>
    );
};
