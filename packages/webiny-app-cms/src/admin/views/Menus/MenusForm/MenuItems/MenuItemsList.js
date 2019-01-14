// @flow
import React from "react";
import SortableTree from "react-sortable-tree/dist/index.cjs";
import { getPlugin } from "webiny-plugins";
import MenuItemRenderer from "./MenuItemRenderer";
import { Typography } from "webiny-ui/Typography";
import styled from "react-emotion";

const TreeWrapper = styled("div")({
    width: "100%",
    height: 400
});

const EmptyTree = styled("div")({
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
});

class MenuItemsList extends React.Component<*> {
    static canHaveChildren(node: Object) {
        const plugin = getPlugin(node.type);
        return plugin ? MenuItemsList.canHaveChildren : false;
    }

    render() {
        const { items, onChange, editItem, deleteItem } = this.props;
        const data = Array.isArray(items) ? [...items] : [];

        let dom = (
            <EmptyTree>
                <Typography use={"overline"}>There are no menu items to display</Typography>
            </EmptyTree>
        );
        if (data.length > 0) {
            dom = (
                <SortableTree
                    treeData={data}
                    onChange={onChange}
                    canNodeHaveChildren={MenuItemsList.canHaveChildren}
                    nodeContentRenderer={MenuItemRenderer}
                    rowHeight={45}
                    generateNodeProps={() => ({
                        editItem,
                        deleteItem
                    })}
                    getNodeKey={({ node }) => node.id}
                />
            );
        }

        return <TreeWrapper>{dom}</TreeWrapper>;
    }
}

export default MenuItemsList;
