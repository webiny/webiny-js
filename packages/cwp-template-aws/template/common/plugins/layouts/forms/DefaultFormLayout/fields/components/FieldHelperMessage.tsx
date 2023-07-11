import styled from "@emotion/styled";

export const FieldHelperMessage = styled.div`
    margin-left: 2px;
    margin-top: -5px;
    margin-bottom: 5px;
    ${props => props.theme.styles.typography["paragraphs"].stylesById("paragraph2")};
    color: ${props => props.theme.styles.colors["color2"]};

    ${props => props.theme.breakpoints["mobile-landscape"]} {
        text-align: left !important;
    }
`;
