import styled from "@emotion/styled";

export const Cell = styled.div`
    width: 100%;
    background-color: ${props => props.theme.styles.colors["color6"]};
    padding: 15px;

    ${props => props.theme.breakpoints["desktop"]} {
        &:first-of-type {
            padding-left: 0;
        }

        &:last-child {
            padding-right: 0;
        }
    }
`;
