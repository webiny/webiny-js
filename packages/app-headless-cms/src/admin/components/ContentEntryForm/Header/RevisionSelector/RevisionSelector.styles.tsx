import styled from "@emotion/styled";
import { ButtonDefault as DefaultButtonDefault } from "@webiny/ui/Button";
import { Menu as DefaultMenu } from "@webiny/ui/Menu";

export const Button = styled(DefaultButtonDefault)`
    color: var(--mdc-theme-text-primary-on-background) !important;
`;

export const Menu = styled(DefaultMenu)`
    width: 150px;
    right: 0;

    .mdc-deprecated-list-item {
        flex-direction: column;
        justify-content: center;
        align-items: baseline;
        text-align: left;
    }
`;
