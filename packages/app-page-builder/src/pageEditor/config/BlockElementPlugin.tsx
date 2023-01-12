import React, { useCallback } from "react";
import { createComponentPlugin } from "@webiny/app-admin";
import { ElementRoot, ElementRootChildrenFunction, DropZone } from "~/editor";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";
import { useCurrentBlockElement } from "~/editor/hooks/useCurrentBlockElement";
import { useCurrentElement } from "~/editor/hooks/useCurrentElement";

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

        if (props.element.type !== "block") {
            return <Original {...props}>{children}</Original>;
        }

        if (!props.element.data?.blockId) {
            return <Original {...props}>{children}</Original>;
        }

        const inert = {
            inert: ""
        };

        /**
         * Block element uses the `render prop` version of `ElementRoot` children, so we only need to handle
         * that scenario: packages/app-page-builder/src/editor/plugins/elements/block/Block.tsx:25
         */
        return (
            <Original {...props}>
                {params => (
                    <div {...inert} onClick={onClick}>
                        {(children as ElementRootChildrenFunction)(params)}
                    </div>
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

            if (block.data?.blockId) {
                props.isVisible = () => {
                    return false;
                };
            }

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
