import styled from "@emotion/styled";

export const Field = styled.div<{ disabled: boolean }>`
    width: 100%;
    box-sizing: border-box;
    ${props =>
        props.disabled
            ? { cursor: "not-allowed", "*": { opacity: 0.75, pointerEvents: "none" } }
            : {}}
    ${props => props.theme.styles.typography.paragraphs.stylesById("paragraph1")};
`;
