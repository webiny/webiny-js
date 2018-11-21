// @flow
import * as React from "react";
import { isDescendant } from "react-sortable-tree";
import classnames from "classnames";
import { getPlugin } from "webiny-app/plugins";
import { IconButton } from "webiny-ui/Button";
import "./MenuItemRenderer.css";
import { ReactComponent as EditIcon } from "./icons/round-edit-24px.svg";
import { ReactComponent as DeleteIcon } from "./icons/round-delete-24px.svg";

class NodeRendererDefault extends React.Component<*> {
    static defaultProps = {
        canDrag: false,
        toggleChildrenVisibility: null,
        buttons: [],
        className: "",
        style: {},
        parentNode: null,
        draggedNode: null,
        canDrop: false,
        title: null,
        subtitle: null
    };

    render() {
        const {
            scaffoldBlockPxWidth,
            toggleChildrenVisibility,
            connectDragPreview,
            connectDragSource,
            isDragging,
            canDrop,
            canDrag,
            node,
            title,
            draggedNode,
            path,
            treeIndex,
            editItem,
            deleteItem,
            className,
            style,
            didDrop
        } = this.props;
        const nodeTitle = title || node.title;

        const plugin = getPlugin(node.type);
        if (!plugin) {
            return null;
        }

        const handle = connectDragSource(<div className="rst__moveHandle">{plugin.icon}</div>, {
            dropEffect: "copy"
        });

        const isDraggedDescendant = draggedNode && isDescendant(draggedNode, node);
        const isLandingPadActive = !didDrop && isDragging;

        let buttonStyle = { left: -0.5 * scaffoldBlockPxWidth };

        return (
            <div style={{ height: "100%" }}>
                {toggleChildrenVisibility &&
                    node.children &&
                    (node.children.length > 0 || typeof node.children === "function") && (
                        <div>
                            <button
                                type="button"
                                aria-label={node.expanded ? "Collapse" : "Expand"}
                                className={classnames(
                                    node.expanded ? "rst__collapseButton" : "rst__expandButton"
                                )}
                                style={buttonStyle}
                                onClick={() =>
                                    toggleChildrenVisibility({
                                        node,
                                        path,
                                        treeIndex
                                    })
                                }
                            />

                            {node.expanded && !isDragging && (
                                <div
                                    style={{ width: scaffoldBlockPxWidth }}
                                    className={classnames("rst__lineChildren")}
                                />
                            )}
                        </div>
                    )}

                <div className={classnames("rst__rowWrapper")}>
                    {/* Set the row preview to be used during drag and drop */}
                    {connectDragPreview(
                        <div
                            className={classnames(
                                "rst__row",
                                isLandingPadActive && "rst__rowLandingPad",
                                isLandingPadActive && !canDrop && "rst__rowCancelPad",
                                className
                            )}
                            style={{
                                opacity: isDraggedDescendant ? 0.5 : 1,
                                ...style
                            }}
                        >
                            {handle}

                            <div
                                className={classnames(
                                    "rst__rowContents",
                                    !canDrag && "rst__rowContentsDragDisabled"
                                )}
                            >
                                <div className={classnames("rst__rowLabel")}>
                                    <span
                                        className={classnames(
                                            "rst__rowTitle",
                                            node.subtitle && "rst__rowTitleWithSubtitle"
                                        )}
                                    >
                                        {nodeTitle}
                                    </span>
                                </div>

                                <div className="rst__rowToolbar">
                                    <IconButton
                                        icon={<EditIcon />}
                                        onClick={() => editItem(node)}
                                    />
                                    <IconButton
                                        icon={<DeleteIcon />}
                                        onClick={() => deleteItem(node)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export default NodeRendererDefault;
