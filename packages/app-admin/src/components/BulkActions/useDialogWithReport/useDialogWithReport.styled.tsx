import styled from "@emotion/styled";
import { ListItemGraphic as BaseListItemGraphic, ListItem as BaseListItem } from "@webiny/ui/List";

export const MessageContainer = styled("div")`
    margin-bottom: 16px;
`;

export const ListItem = styled(BaseListItem)`
    overflow: visible !important;
`;

type ListItemGraphicProps = {
    status: "success" | "failure";
};

export const ListItemGraphic = styled(BaseListItemGraphic)<ListItemGraphicProps>`
    color: ${props =>
        props.status === "failure"
            ? "var(--mdc-theme-error)"
            : "var(--mdc-theme-secondary)"} !important;
`;
