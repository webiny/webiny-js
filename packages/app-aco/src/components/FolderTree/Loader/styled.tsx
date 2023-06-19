import styled from "@emotion/styled";

export const Container = styled("div")`
    padding: 4px;
`;

export const SkeletonWrapper = styled("div")`
    width: 100%;
    align-content: center;
    margin: 8px auto;
    height: 24px;

    &:last-of-type {
        margin-bottom: 0;
    }
`;
