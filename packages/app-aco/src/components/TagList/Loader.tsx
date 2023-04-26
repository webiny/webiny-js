import React from "react";

import { Skeleton } from "@webiny/ui/Skeleton";

import { LoaderContainer, SkeletonWrapper } from "./styled";

export const Loader = () => {
    return (
        <LoaderContainer>
            <Skeleton count={4} inline={true} height={"100%"} wrapper={SkeletonWrapper} />
        </LoaderContainer>
    );
};
