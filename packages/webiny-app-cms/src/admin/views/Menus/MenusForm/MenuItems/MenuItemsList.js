// @flow
import React from "react";
import SortableTree from "react-sortable-tree";
import menuTypePresets from "./menuTypePresets";
import MenuItemRenderer from "./MenuItemRenderer";

class MenuItemsList extends React.Component<*> {
    render() {
        const { items, onChange, editItem, deleteItem } = this.props;
        const data = Array.isArray(items) ? [...items] : [];

        return (
            <div style={{ height: 400 }}>
                <SortableTree
                    treeData={data}
                    onChange={onChange}
                    canNodeHaveChildren={node => menuTypePresets[node.type].canNodeHaveChildren}
                    nodeContentRenderer={MenuItemRenderer}
                    generateNodeProps={() => ({
                        editItem,
                        deleteItem
                    })}
                    getNodeKey={({ node }) => node.id}
                />
            </div>
        );
    }
}

export default MenuItemsList;
