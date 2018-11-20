// @flow
import React from "react";
import SortableTree from "react-sortable-tree";
import { getPlugin } from "webiny-app/plugins";
import MenuItemRenderer from "./MenuItemRenderer";

class MenuItemsList extends React.Component<*> {
    canHaveChildren(node: Object) {
        const plugin = getPlugin(node.type);
        return plugin ? plugin.canHaveChildren : false;
    }

    render() {
        const { items, onChange, editItem, deleteItem } = this.props;
        const data = Array.isArray(items) ? [...items] : [];

        return (
            <div style={{ height: 400 }}>
                <SortableTree
                    treeData={data}
                    onChange={onChange}
                    canNodeHaveChildren={this.canHaveChildren}
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
