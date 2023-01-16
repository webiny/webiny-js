import styled from "@emotion/styled";

export const Container = styled("div")`
    padding: 42px 4px 0;
`;

export const SkeletonWrapper = styled("div")`
    width: 85%;
    margin: 0 8px 8px;
    height: 24px;

    &:last-of-type {
        margin-bottom: 0;
    }
`;
