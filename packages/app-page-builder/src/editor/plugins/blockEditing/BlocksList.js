// @flow
import * as React from "react";
import { get } from "lodash";
import { List, WindowScroller } from "react-virtualized";
import BlockPreview from "./BlockPreview";

const listWidth = 800;

class BlocksList extends React.Component<*, *> {
    state = { listHeight: 0 };
    rightPanelElement: ?HTMLElement;

    componentDidUpdate(prevProps: Object) {
        // Scroll only if the active block category has changed
        if (this.rightPanelElement && prevProps.category !== this.props.category) {
            if (this.rightPanelElement.scrollTop === 0) {
                // $FlowFixMe
                this.rightPanelElement.scroll(0, 1);
                return;
            }
            // $FlowFixMe
            this.rightPanelElement.scroll(0, 0);
        }
    }

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

        this.rightPanelElement = document.getElementById("@webiny/secondary-view-right-panel");
        if (!this.rightPanelElement) {
            return null;
        }

        return (
            <WindowScroller scrollElement={this.rightPanelElement}>
                {({ isScrolling, registerChild, onChildScroll, scrollTop }) => (
                    <div style={{ flex: "1 1 auto" }}>
                        <div style={{ width: "800px", margin: "0 auto" }} ref={registerChild}>
                            <List
                                autoHeight
                                height={window.innerHeight - 70}
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
