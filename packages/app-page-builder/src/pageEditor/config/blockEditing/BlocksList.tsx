import React, { useState, useEffect, useRef } from "react";
import { get } from "lodash";
import { List, WindowScroller } from "react-virtualized";
import BlockPreview from "./BlockPreview";
import { css } from "emotion";
import { PbEditorBlockPlugin } from "~/types";

const listStyle = css({
    "& .ReactVirtualized__Grid__innerScrollContainer": {
        overflow: "auto !important"
    }
});

const listWidth = 800;

interface GetRowHeightParams {
    index: number;
    blocks: PbEditorBlockPlugin[];
}
const getRowHeight = (params: GetRowHeightParams): number => {
    const { index, blocks } = params;
    let height = get(blocks[index], "image.meta.height", 50);

    const width = get(blocks[index], "image.meta.width", 50);
    if (width > listWidth) {
        const downscaleRatio = width / listWidth;
        height = height / downscaleRatio;
    }
    return height + 100;
};

interface RenderRowProps {
    index: number;
    key: string;
    style: Record<string, any>;
    onEdit: (plugin: PbEditorBlockPlugin) => void;
    onDelete: (plugin: PbEditorBlockPlugin) => void;
    blocks: PbEditorBlockPlugin[];
    // deactivatePlugin: (plugin: PbEditorBlockPlugin) => void;
    addBlock: (plugin: PbEditorBlockPlugin) => void;
}

const renderRow = (props: RenderRowProps): React.ReactNode => {
    const { index, key, style, blocks, onEdit, onDelete, addBlock } = props;
    const plugin = blocks[index];

    return (
        <div key={key} style={style} data-testid="pb-editor-page-blocks-list-item">
            <BlockPreview
                plugin={plugin}
                onEdit={() => onEdit(plugin)}
                onDelete={() => onDelete(plugin)}
                addBlockToContent={addBlock}
            />
        </div>
    );
};

interface BlocksListProps extends Omit<RenderRowProps, "index" | "key" | "style"> {
    category: string;
}

const BlocksList: React.FC<BlocksListProps> = props => {
    const [, setTimestamp] = useState<number>(-1);
    const rightPanelElement = useRef<HTMLElement | null>(null);
    const prevProps = useRef<BlocksListProps | null>(null);

    useEffect(() => {
        rightPanelElement.current = document.querySelector(".webiny-split-view__right-panel");
        setTimestamp(new Date().getTime());
    }, []);

    useEffect(() => {
        if (!prevProps.current) {
            return;
        }

        // Scroll only if the active block category has changed
        if (rightPanelElement.current && prevProps.current.category !== props.category) {
            if (rightPanelElement.current.scrollTop === 0) {
                rightPanelElement.current.scroll(0, 1);
                return;
            }
            rightPanelElement.current.scroll(0, 0);
        }
    }, []);

    useEffect(() => {
        prevProps.current = props;
    }, []);

    const { blocks, category } = props;

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
                            rowHeight={rowHeightParams => {
                                return getRowHeight({
                                    ...rowHeightParams,
                                    blocks
                                });
                            }}
                            rowRenderer={rendererProps => {
                                return renderRow({
                                    ...rendererProps,
                                    blocks,
                                    addBlock: props.addBlock,
                                    onEdit: props.onEdit,
                                    onDelete: props.onDelete
                                });
                            }}
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
