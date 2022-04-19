import { Box } from "~/components/Layout";
import { ListItem } from "@webiny/ui/List";
import { Typography } from "@webiny/ui/Typography";
import styled from "@emotion/styled";
import { css } from "emotion";

export const richTextWrapperStyles = css`
    background-color: transparent;
    padding: 0;
`;

export const PanelBox = styled(Box)<{ flex: string }>`
    border-right: 1px solid var(--mdc-theme-background);
    height: calc(100vh - 65px);
    flex: ${props => props.flex};
`;

export const PanelListItem = styled(ListItem)`
    height: auto;
    padding: 20px 16px;
    border-bottom: 1px solid var(--mdc-theme-background);
`;

export const TypographyTitle = styled(Typography)`
    font-weight: 600;
    line-height: 1.25rem;
`;

export const TypographyBody = styled(Typography)`
    line-height: 0.95rem;
`;

export const TypographySecondary = styled(TypographyBody)`
    color: var(--mdc-theme-text-secondary-on-background);
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

export const AuthorName = styled(TypographyTitle)`
    text-transform: capitalize;
`;

export const BadgeBox = styled(Box)`
    width: fit-content;
    height: 18px;
    display: flex;
    align-items: center;
    background-color: var(--mdc-theme-on-background);
    border-radius: 2px;
    line-height: initial;

    & span {
        font-size: 10px;
        line-height: 13px;
        text-transform: uppercase;
    }
`;

export const ChangeRequestItem = styled(ListItem)`
    height: auto;
    padding: 20px 16px;
    border-bottom: 1px solid var(--mdc-theme-background);
`;
