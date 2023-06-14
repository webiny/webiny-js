import styled from "@emotion/styled";

export const TagContainer = styled("div")`
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    padding: 4px 8px;
    color: var(--mdc-theme-on-surface);

    &:hover {
        background: var(--mdc-theme-background);
    }
`;

type IconProps = {
    active: boolean;
};

export const Icon = styled("div")<IconProps>`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    width: 20px;
    cursor: pointer;
    padding-right: 4px;
    fill: ${props =>
        props.active
            ? "var(--mdc-theme-secondary)"
            : "var(--mdc-theme-text-secondary-on-background)"};
`;

export const EmptyContainer = styled("div")`
    padding: 8px 12px 8px;
    color: var(--webiny-theme-color-text-secondary);
    fill: currentColor;
`;

export const LoaderContainer = styled("div")`
    padding: 8px 4px;
`;

export const SkeletonWrapper = styled("div")`
    width: 85%;
    margin: 0 8px 8px;
    height: 24px;

    &:last-of-type {
        margin-bottom: 0;
    }
`;
