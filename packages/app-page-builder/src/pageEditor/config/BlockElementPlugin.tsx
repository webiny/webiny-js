import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { createComponentPlugin } from "@webiny/app-admin";
import { ElementRoot, ElementRootChildrenFunction, DropZone } from "~/editor";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useCurrentBlockElement } from "~/editor/hooks/useCurrentBlockElement";
import { useCurrentElement } from "~/editor/hooks/useCurrentElement";

const DisableInteractions = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: unset;
    z-index: 100;
    cursor: pointer;
`;

/**
 * Hook into `ElementRoot`, which is a component that renders _every_ element of the page content.
 * If it's a `block` element, add an overlay to disable mouse interactions.
 */
const DisableInteractionsPlugin = createComponentPlugin(ElementRoot, Original => {
    return function ElementRoot({ children, ...props }) {
        const [, setActiveElementId] = useActiveElementId();
        const { element } = useCurrentElement();

        const onClick = useCallback(() => {
            setActiveElementId(element.id);
        }, [element.id]);

        if (element.type !== "block") {
            return <Original {...props}>{children}</Original>;
        }

        // TODO: add handling of the "empty" block. We don't want to disable interactions on an empty block
        // because it is considered to be a custom inline block, created for a specific page.

        /**
         * Block element uses the `render prop` version of `ElementRoot` children, so we only need to handle
         * that scenario: packages/app-page-builder/src/editor/plugins/elements/block/Block.tsx:25
         */
        return (
            <Original {...props}>
                {params => (
                    <>
                        <DisableInteractions onClick={onClick} />
                        {(children as ElementRootChildrenFunction)(params)}
                    </>
                )}
            </Original>
        );
    };
});

const plugins = [DropZone.Below, DropZone.Above].map(Component => {
    return createComponentPlugin(Component, Original => {
        return function BlockDropZone({ children, ...props }) {
            const { block } = useCurrentBlockElement();

            if (!block) {
                return <Original {...props}>{children}</Original>;
            }

            // TODO: add a check to see if this block can be edited: "empty" block or "unlinked" block
            // Example code:
            //
            // if (block.id !== "dUXdSfGGdW") {
            //     props.isVisible = () => {
            //         return false;
            //     };
            // }

            return <Original {...props}>{children}</Original>;
        };
    });
});

export const BlockElementPlugin = () => {
    return (
        <>
            <DisableInteractionsPlugin />
            {plugins.map((Plugin, index) => (
                <Plugin key={index} />
            ))}
        </>
    );
};
