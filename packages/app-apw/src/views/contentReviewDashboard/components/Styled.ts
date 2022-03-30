import { css } from "emotion";
import styled from "@emotion/styled";
import { Typography } from "@webiny/ui/Typography";
import { Box } from "~/components/Layout";
import commentBadgeImage from "~/assets/icons/comment-badge_figma.svg";
import checkmarkImage from "~/assets/icons/checkmark_figma.svg";

export const statusBoxStyle = css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-left: 1px solid var(--mdc-theme-on-background);
`;

export const Circle = styled(Box)<{ active: boolean }>`
    border-radius: 50%;
    position: relative;
    background-color: ${props =>
        props.active ? "var(--mdc-theme-secondary)" : "var(--mdc-theme-background)"};
    width: 16px;
    height: 16px;
    box-sizing: border-box;
    // Center any svg (checkmark in this case).
    &::before {
        content: "";
        display: ${props => (props.active ? "block" : "none")};
        position: absolute;
        top: 5px;
        left: 3px;
        width: 9px;
        height: 7px;
        background-image: url(${checkmarkImage});
    }

    // Make a pill shaped element that will act as link between two circles.
    &::after {
        content: "";
        position: absolute;
        width: 10px;
        height: 2px;
        right: -13px;
        top: 7px;
        background-color: ${props =>
            props.active ? "var(--mdc-theme-secondary)" : "var(--mdc-theme-background)"};
        border-radius: 100px;
    }

    // We don't want to show the link after the last element.

    &:last-child {
        &::after {
            display: none;
        }
    }
`;

export const OverlappingAvatar = styled(Box)`
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 1px solid var(--mdc-theme-surface);
    background: linear-gradient(135deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);
`;

export const TypographyBold = styled(Typography)`
    font-weight: 600;
    line-height: 1.25rem;
`;

export const TypographySecondary = styled(Typography)`
    color: var(--mdc-theme-text-secondary-on-background);
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`;

export const AuthorName = styled(TypographySecondary)`
    text-transform: capitalize;
`;

export const StatusBox = styled(Box)`
    background-color: var(--mdc-theme-on-background);
    text-transform: uppercase;
    border-radius: 2px;
`;

export const CommentStatusBox = styled(Box)`
    flex-direction: column;
    background-color: var(--mdc-theme-background);
`;

export const listItemStyles = css`
    flex-grow: 1;
    max-width: 100%;
`;

export const CommentCountBox = styled(Box)`
    position: relative;
    width: 22px;
    height: 15px;
    // Makes content align center.
    display: flex;
    justify-content: center;
    align-items: center;

    &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 19px;
        background-image: url(${commentBadgeImage});
    }
`;

export const CommentsCount = styled.span`
    z-index: 1;
    color: var(--mdc-theme-surface);
    font-size: 10px;
    line-height: 12.57px;
    font-weight: 700;
`;

export const StatusText = styled.span`
    font-size: 10px;
    font-style: normal;
    font-weight: 400;
    line-height: 11px;
    letter-spacing: 0;
    text-align: center;
`;
