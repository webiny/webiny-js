import styled from "@emotion/styled";

export const Container = styled("div")`
    display: flex;
    justify-content: flex-end;
    align-items: center;

    > button {
        flex-shrink: 0;
    }

    > button:first-of-type {
        margin-left: 0;
    }
`;
