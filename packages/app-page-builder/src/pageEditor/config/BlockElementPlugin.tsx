import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { createComponentPlugin } from "@webiny/app-admin";
import { ElementRoot, ElementRootChildrenFunction } from "~/render";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";

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
export const BlockElementPlugin = createComponentPlugin(ElementRoot, Original => {
    return function ElementRoot({ children, ...props }) {
        const [, setActiveElementId] = useActiveElementId();

        const onClick = useCallback(() => {
            setActiveElementId(props.element.id);
        }, [props.element.id]);

        if (props.element.type !== "block") {
            return <Original {...props}>{children}</Original>;
        }

        // TODO: add handling of the "empty" block. We don't want to disable interactions on the empty block
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
