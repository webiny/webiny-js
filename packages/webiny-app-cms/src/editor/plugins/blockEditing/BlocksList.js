// @flow
import * as React from "react";
import { get } from "lodash";
import { List, WindowScroller } from "react-virtualized";
import BlockPreview from "./BlockPreview";

const listWidth = 800;

class BlocksList extends React.Component<*, *> {
    state = { listHeight: 0 };

    getRowHeight = ({ index }: Object) => {
        let height = get(this.props.blocks[index], "image.meta.height", 50);
        let width = get(this.props.blocks[index], "image.meta.width", 50);

        if (width > listWidth) {
            let downscaleRatio = width / listWidth;
            height = height / downscaleRatio;
        }

        return height + 100;
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
                                width={listWidth}
                                overscanRowCount={2}
                            />
                        </div>
                    </div>
                )}
            </WindowScroller>
        );
    }
}

export default BlocksList;
