import styled from "@emotion/styled";
import { Heading } from "@webiny/admin-ui";

export const Name = styled(Heading)`
    color: var(--mdc-theme-text-primary-on-background);
    padding-left: 8px;
    line-height: 48px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;
