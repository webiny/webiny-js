import React, { useState, useEffect, useRef } from "react";
import { get } from "lodash";
import { List, WindowScroller } from "react-virtualized";
import BlockPreview from "./BlockPreview";
import { css } from "emotion";

const listStyle = css({
    "& .ReactVirtualized__Grid__innerScrollContainer": {
        overflow: "auto !important"
    }
});

const listWidth = 800;

const BlocksList = props => {
    const [, setTimestamp] = useState(null);
    const rightPanelElement = useRef(null);
    const prevProps = useRef(null);

    useEffect(() => {
        rightPanelElement.current = document.querySelector(".webiny-split-view__right-panel");
        setTimestamp(new Date().getTime());
    }, []);

    useEffect(() => {
        if (!prevProps.current) {
            return;
        }

        // Scroll only if the active block category has changed
        if (rightPanelElement && prevProps.current.category !== props.category) {
            if (rightPanelElement.current.scrollTop === 0) {
                rightPanelElement.current.scroll(0, 1);
                return;
            }
            rightPanelElement.current.scroll(0, 0);
        }
    });

    useEffect(() => {
        prevProps.current = props;
    });

    const { blocks, category, onEdit, onDelete, deactivatePlugin, addBlock } = props;

    const getRowHeight = ({ index }) => {
        let height = get(blocks[index], "image.meta.height", 50);

        const width = get(blocks[index], "image.meta.width", 50);
        if (width > listWidth) {
            const downscaleRatio = width / listWidth;
            height = height / downscaleRatio;
        }
        return height + 100;
    };

    const renderRow = ({ index, key, style }) => {
        const plugin = blocks[index];

        return (
            <div key={key} style={style} data-testid="pb-editor-page-blocks-list-item">
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

    if (!rightPanelElement.current) {
        return null;
    }

    return (
        <WindowScroller scrollElement={rightPanelElement.current}>
            {({ isScrolling, registerChild, onChildScroll, scrollTop }) => (
                <div style={{ flex: "1 1 auto" }}>
                    <div
                        style={{ width: "800px", margin: "0 auto" }}
                        ref={registerChild}
                        data-testid={"pb-editor-page-blocks-list"}
                    >
                        <List
                            className={listStyle}
                            key={category}
                            autoHeight
                            height={window.innerHeight - 70}
                            isScrolling={isScrolling}
                            onScroll={onChildScroll}
                            rowCount={blocks.length}
                            rowHeight={getRowHeight}
                            rowRenderer={renderRow}
                            scrollTop={scrollTop}
                            width={listWidth}
                            overscanRowCount={2}
                        />
                    </div>
                </div>
            )}
        </WindowScroller>
    );
};

export default BlocksList;
