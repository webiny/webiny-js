import styled from "@emotion/styled";
import { css } from "emotion";

export const SelectBoxWrapper = styled.div`
    overflow: hidden;
    width: 25px;
    height: 25px;
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
`;

export const webinyList = css`
    // Remove ripple effect on non-interactive list
    &.mdc-deprecated-list--non-interactive .mdc-deprecated-list-item {
        cursor: default;

        > .mdc-deprecated-list-item__ripple::after,
        > .mdc-deprecated-list-item__ripple::before {
            display: none;
        }
    }
`;
