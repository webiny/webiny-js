import styled from "@emotion/styled";
import { ReactComponent as PermissionIcon } from "@material-design-icons/svg/outlined/privacy_tip.svg";
import { Typography } from "@webiny/ui/Typography";

export const NoPermissionWrapper = styled("div")`
    margin: 0 auto;
    padding-top: 0;
    height: calc(100vh - 95px);
    z-index: 2;
    width: 100%;
    position: absolute;
    background-color: transparent;
`;

export const NoPermissionOuter = styled("div")`
    text-align: center;
    width: 300px;
    height: 300px;
    background-color: var(--mdc-theme-surface);
    border-radius: 50%;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
`;

export const NoPermissionInner = styled("div")`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 35px;
    width: 300px;
    color: var(--mdc-theme-on-surface);
`;

export const NoPermissionIcon = styled(PermissionIcon)`
    width: 100px !important;
    height: auto;
    display: inline-block;
    color: var(--mdc-theme-on-surface);
`;

export const NoPermissionTitle = styled(Typography)`
    margin-top: 8px;
`;

export const NoPermissionBody = styled(Typography)`
    padding: 0 16px;
    color: var(--mdc-theme-text-secondary-on-background);
`;
