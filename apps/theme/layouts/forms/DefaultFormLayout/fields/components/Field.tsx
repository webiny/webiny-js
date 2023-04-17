import styled from "@emotion/styled";
import theme from "../../../../../theme";

export const Field = styled.div`
    width: 100%;
    box-sizing: border-box;
    ${props => props.theme.styles.typography["paragraph1"]};
`;
