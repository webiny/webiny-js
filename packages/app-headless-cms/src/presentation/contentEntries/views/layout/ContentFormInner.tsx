import styled from "@emotion/styled";

type ContentFormInnerProps = { width: string };

export const ContentFormInner = styled.div<ContentFormInnerProps>`
    width: ${props => props.width};
`;
