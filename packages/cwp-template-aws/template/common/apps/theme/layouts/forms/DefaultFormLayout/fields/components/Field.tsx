import styled from "@emotion/styled";

export const Field = styled.div`
    width: 100%;
    box-sizing: border-box;
    ${props => props.theme.styles.typography["paragraphs"].stylesById("paragraph1")};
`;
