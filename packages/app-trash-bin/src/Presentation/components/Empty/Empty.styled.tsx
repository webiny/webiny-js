import styled from "@emotion/styled";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete_forever.svg";
import { Typography } from "@webiny/ui/Typography";

export const EmptyWrapper = styled("div")`
    width: 100%;
    height: calc(100% - 95px);
    display: flex;
    justify-content: center;
    align-items: center;
`;

export const EmptyOuter = styled("div")`
    display: flex;
    flex-direction: column;
    align-items: center;
`;

export const EmptyIcon = styled(DeleteIcon)`
    width: 72px !important;
    height: auto;
    color: var(--mdc-theme-text-secondary-on-background);
`;

export const EmptyTitle = styled(Typography)`
    margin-top: 8px;
`;
