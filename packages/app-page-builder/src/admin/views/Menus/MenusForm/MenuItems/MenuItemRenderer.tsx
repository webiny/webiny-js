/**
 * TODO @ts-refactor
 * verify that all types are correct.
 */
import React, { forwardRef } from "react";
// import { TreeItemComponentProps } from "dnd-kit-sortable-tree";
import classnames from "classnames";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Icon } from "@webiny/ui/Icon";
import { rowHandle, fieldContainer, Row, RowContainer, FolderTreeItemWrapper } from "./Styled";
import { ReactComponent as EditIcon } from "./icons/round-edit-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/round-delete-24px.svg";
import { ReactComponent as HandleIcon } from "./icons/round-drag_indicator-24px.svg";
import { TreeItemComponentProps, MenuTreeItem } from "~/admin/views/Menus/types";
export interface NodeRendererDefaultProps {
    editItem: (item: MenuTreeItem) => void;
    deleteItem: (item: MenuTreeItem) => void;
}
const NodeRendererDefault = forwardRef<HTMLDivElement, TreeItemComponentProps>((props, ref) => {
    const { item, deleteItem, editItem, onRemove, collapsed, depth } = props;
    const handle = (
        <div className={rowHandle}>
            <Icon icon={<HandleIcon />} />
        </div>
    );
    return (
        <FolderTreeItemWrapper {...props} ref={ref} depth={depth} collapsed={collapsed}>
            <RowContainer className={"rst__rowWrapper"}>
                {handle}
                <div>
                    <Row className={classnames("rst__row")}>
                        <div className={classnames(fieldContainer)}>
                            <div className={classnames("rst__rowLabel")}>
                                <span className={classnames("rst__rowTitle")}>
                                    <Typography use={"overline"}>{item.title}</Typography>
                                </span>
                            </div>
                            <div className="rst__rowToolbar">
                                <IconButton
                                    data-testid={"pb-edit-icon-button"}
                                    icon={<EditIcon />}
                                    onClick={() => editItem(item)}
                                />
                                <IconButton
                                    data-testid={"pb-delete-icon-button"}
                                    icon={<DeleteIcon />}
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (onRemove) {
                                            onRemove();
                                            deleteItem(item);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </Row>
                </div>
            </RowContainer>
        </FolderTreeItemWrapper>
    );
});
NodeRendererDefault.displayName = "NodeRendererDefault";
export default NodeRendererDefault;
