import React, { useEffect, useRef, useState } from "react";
import { useInViewport } from "react-in-viewport";
import styled from "@emotion/styled";
import BlockPreview from "./BlockPreview";
import { PbEditorBlockPlugin } from "~/types";

interface RenderRowProps {
    index: number;
    onEdit: (plugin: PbEditorBlockPlugin) => void;
    onDelete: (plugin: PbEditorBlockPlugin) => void;
    blocks: PbEditorBlockPlugin[];
    addBlock: (plugin: PbEditorBlockPlugin) => void;
}

const BlockSkeleton = styled.div`
    height: 250px;
    width: 100%;
`;

const BlockRow = (props: RenderRowProps) => {
    const myRef = useRef<HTMLDivElement | null>(null);
    const [wasVisible, setWasVisible] = useState(false);

    const { inViewport } = useInViewport(myRef);
    const { index, blocks, onEdit, onDelete, addBlock } = props;
    const plugin = blocks[index];

    useEffect(() => {
        if (inViewport) {
            setWasVisible(true);
        }
    }, [inViewport]);

    return (
        <div ref={dom => (myRef.current = dom)}>
            {wasVisible ? (
                <BlockPreview
                    plugin={plugin}
                    onEdit={() => onEdit(plugin)}
                    onDelete={() => onDelete(plugin)}
                    addBlockToContent={addBlock}
                />
            ) : (
                <BlockSkeleton />
            )}
        </div>
    );
};

interface BlocksListProps extends Omit<RenderRowProps, "index" | "key" | "style"> {
    category: string;
}

const BlocksList: React.FC<BlocksListProps> = props => {
    const rightPanelElement = useRef<HTMLElement | null>(null);
    const prevProps = useRef<BlocksListProps | null>(null);

    useEffect(() => {
        rightPanelElement.current = document.querySelector(
            ".webiny-split-view__right-panel-wrapper"
        );
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
    }, [props]);

    useEffect(() => {
        prevProps.current = props;
    }, [props]);

    const { blocks } = props;

    if (!rightPanelElement.current) {
        return null;
    }

    return (
        <div style={{ flex: "1 1 auto" }}>
            <div
                style={{ width: "800px", margin: "0 auto" }}
                data-testid={"pb-editor-page-blocks-list"}
            >
                {blocks.map((block, index) => (
                    <BlockRow
                        key={block.name}
                        index={index}
                        blocks={blocks}
                        addBlock={props.addBlock}
                        onEdit={props.onEdit}
                        onDelete={props.onDelete}
                    />
                ))}
            </div>
        </div>
    );
};

export default BlocksList;
