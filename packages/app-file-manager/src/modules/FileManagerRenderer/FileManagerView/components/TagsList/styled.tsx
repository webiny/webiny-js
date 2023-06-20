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

export const TagListWrapper = styled("div")({
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10,
    padding: "0 10px",
    ".tag-filter": {
        width: 110
    }
});
