import styled from "@emotion/styled";

type IconProps = {
    active: boolean;
};

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
