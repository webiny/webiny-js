// @flow
import * as React from "react";
import { get } from "lodash";
import { List } from "react-virtualized";
import BlockPreview from "./BlockPreview";

class BlocksList extends React.Component<*, *> {
    state = { listHeight: 0 };

    getRowHeight = ({ index }: Object) => {
        return get(this.props.blocks[index], "image.height", 300) + 75;
    };

    renderRow = ({ index, key, style }: Object) => {
        const { blocks, onEdit, onDelete, deactivatePlugin, addBlock } = this.props;

        const plugin = blocks[index];

        return (
            <div key={key} style={style}>
                <BlockPreview
                    plugin={plugin}
                    onEdit={() => onEdit(plugin)}
                    onDelete={() => onDelete(plugin)}
                    addBlockToContent={addBlock}
                    deactivatePlugin={deactivatePlugin}
                />
            </div>
        );
    };

    render() {
        const { blocks } = this.props;
        return (
            <List
                height={window.innerHeight - 70} /* TODO: @sven */
                rowCount={blocks.length}
                rowHeight={this.getRowHeight}
                rowRenderer={this.renderRow}
                width={800}
                overscanRowCount={2}
            />
        );
    }
}

export default BlocksList;
