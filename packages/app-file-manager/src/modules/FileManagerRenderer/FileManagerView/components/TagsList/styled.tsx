import styled from "@emotion/styled";
import { Select } from "@webiny/ui/Select";
import { Typography } from "@webiny/ui/Typography";

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
export const TagListWrapper = styled("div")`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    margin: 8px;
`;

export const TagsFilterSelect = styled(Select)`
    max-width: 150px;
    min-width: auto;
    flex-shrink: 0;
`;

export const TagsTitle = styled(Typography)`
    margin: 0 0 5px;
    flex: 1 1 auto;
`;
