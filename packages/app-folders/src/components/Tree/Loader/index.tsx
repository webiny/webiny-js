import React from "react";

import { Skeleton } from "@webiny/ui/Skeleton";

import { SkeletonWrapper } from "./styled";

export const Loader = () => {
    return <Skeleton count={4} inline={true} height={"100%"} wrapper={SkeletonWrapper} />;
};
