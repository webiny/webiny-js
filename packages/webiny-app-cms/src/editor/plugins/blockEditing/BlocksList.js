// @flow
import * as React from "react";
import { get } from "lodash";
import { List, WindowScroller, AutoSizer } from "react-virtualized";
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

        const rightPanelElement = document.getElementById("webiny-secondary-view-right-panel");
        if (!rightPanelElement) {
            return null;
        }

        return (
            <WindowScroller scrollElement={rightPanelElement}>
                {({ isScrolling, registerChild, onChildScroll, scrollTop }) => (
                    <div style={{ flex: "1 1 auto" }}>
                        <AutoSizer disableHeight>
                            {({ width }) => (
                                <div ref={registerChild}>
                                    <List
                                        autoHeight
                                        height={window.innerHeight - 70} /* TODO: @sven */
                                        isScrolling={isScrolling}
                                        onScroll={onChildScroll}
                                        rowCount={blocks.length}
                                        rowHeight={this.getRowHeight}
                                        rowRenderer={this.renderRow}
                                        scrollTop={scrollTop}
                                        width={width}
                                        overscanRowCount={2}
                                    />
                                </div>
                            )}
                        </AutoSizer>
                    </div>
                )}
            </WindowScroller>
        );
    }
}

export default BlocksList;
