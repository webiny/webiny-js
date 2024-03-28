import { css } from "emotion";
import styled from "@emotion/styled";
import { FolderTreeItemWrapper as DefaultFolderTreeItemWrapper } from "dnd-kit-sortable-tree";
export const RowContainer = styled("div")({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    marginBottom: 25,
    borderRadius: 2,
    padding: "0 !important",
    height: "auto !important",
    backgroundColor: "var(--mdc-theme-surface)",
    border: "1px solid var(--mdc-theme-on-background)",
    boxShadow:
        "var(--mdc-theme-on-background) 1px 1px 1px, var(--mdc-theme-on-background) 1px 1px 2px"
});
export const Row = styled("div")({
    display: "flex",
    flexDirection: "row",
    backgroundColor: "var(--mdc-theme-surface)",
    paddingLeft: 40,
    paddingRight: 0,
    position: "relative"
});
export const fieldContainer = css({
    display: "flex",
    alignItems: "center",
    position: "relative",
    flex: "1 100%",
    backgroundColor: "var(--mdc-theme-background)",
    padding: "0 15px",
    margin: 10,
    borderRadius: 2,
    border: "1px solid var(--mdc-theme-on-background)",
    transition: "box-shadow 225ms",
    color: "var(--mdc-theme-on-surface)",
    "&:hover": {
        boxShadow:
            "var(--mdc-theme-on-background) 1px 1px 1px, var(--mdc-theme-on-background) 1px 1px 2px"
    }
});
export const rowHandle = css({
    width: 30,
    cursor: "grab",
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
    color: "var(--mdc-theme-on-surface)"
});
export const FolderTreeItemWrapper = styled(DefaultFolderTreeItemWrapper)<{
    depth?: number;
    collapsed?: boolean;
}>`
    height: 80px;
    position: relative;
    & .dnd-sortable-tree_folder_line {
        background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><line stroke='black' style='stroke-width: 1px;' x1='50%' y1='0' x2='50%' y2='100%'/></svg>");
        width: 44px;
    }
    & .dnd-sortable-tree_folder_line-to_self {
        background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'>
            <line stroke='black' style='stroke-width: 1px;' x1='50%' y1='0' x2='50%' y2='100%'/>
            <line stroke='black' style='stroke-width: 1px;' x1='50%' y1='35%' x2='100%' y2='35%'/>
        </svg>
        ");
        width: 44px;
    }
    & .dnd-sortable-tree_folder_line-to_self-last {
        background: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'>
            <line stroke='black' style='stroke-width: 1px;' x1='50%' y1='0' x2='50%' y2='36.6%'/>
            <line stroke='black' style='stroke-width: 1px;' x1='50%' y1='36%' x2='100%' y2='36%'/>
        </svg>");
        width: 44px;
    }
    & .dnd-sortable-tree_folder_tree-item-collapse_button {
        ${props =>
            props.collapsed
                ? `background: #fff url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCI+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjgiIGZpbGw9IiNGRkYiLz48ZyBzdHJva2U9IiM5ODk4OTgiIHN0cm9rZS13aWR0aD0iMS45Ij48cGF0aCBkPSJNNC41IDloOU05IDQuNXY5Ii8+PC9nPjwvc3ZnPg==") no-repeat 50%;`
                : `        background: #fff url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCI+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjgiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNNC41IDloOSIgc3Ryb2tlPSIjOTg5ODk4IiBzdHJva2Utd2lkdGg9IjEuOSIvPjwvc3ZnPg==") no-repeat 50%;
            `};
        position: absolute;
        top: 17px;
        ${props => (props.depth !== 0 ? `left: ${46}px;` : `left: 13px;`)};
        border: 1px solid black;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        z-index: 10;
    }
    & .dnd-sortable-tree_folder_tree-item {
        position: relative;
        ${props => props.depth && `left: ${props.depth * 15}px;`};
    }
    & .dnd-sortable-tree_folder_line-to_self {
        position: relative;
        ${props => props.depth && `left: ${props.depth * 15}px;`};
    }
    .dnd-sortable-tree_folder_line-to_self-last {
        position: relative;
        ${props => props.depth && `left: ${props.depth * 15}px;`};
    }
    & .dnd-sortable-tree_folder_line {
        position: relative;
        ${props => props.depth && `left: ${props.depth * 15 - 15}px;`};
    }
    & .dnd-sortable-tree_folder_line:first-of-type {
        left: 0;
    }
`;
