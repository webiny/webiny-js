import React from "react";

import { Skeleton } from "@webiny/ui/Skeleton";

import { Container, SkeletonWrapper } from "./styled";

export const Loader = () => {
    return (
        <Container>
            <Skeleton count={4} inline={true} height={"100%"} wrapper={SkeletonWrapper} />
        </Container>
    );
};
