import React from "react";
import { PbEditorOverrideActionHandlerPlugin } from "../PbEditorOverrideEventActionPlugin";
import {
    dropElementAction,
    DropElementActionEvent
} from "@webiny/app-page-builder/editor/recoil/actions";
import type { DropElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/dropElement/types";
import type { EventActionCallable, PbEditorElementTree } from "@webiny/app-page-builder/types";
import { Snackbar } from "@webiny/ui/Snackbar";
import { useDisclosure } from "../../useDisclosure";
import { ElementTreeTraverser } from "../../../../shared/ElementTreeTraverser";
import {
    CONTAINER_ELEMENT_ID,
    isFieldElementType,
    isFunnelElement
} from "../../../../shared/constants";

export interface Handler {
    name: string;
    canHandle: () => boolean;
    handle: (params: {
        args: DropElementActionArgsType;
        getDocumentElement: () => Promise<any>;
        getElementById: (id: string) => Promise<any>;
        getElementTree: (params: { element: any }) => Promise<any>;
    }) => Promise<any>;
}

const DO_NOTHING = { actions: [] };

export const OverrideDropElementActionPlugin = () => {
    const {
        open: showSnackbar,
        close: hideSnackbar,
        isOpen: snackbarShown,
        data: snackbarMessage
    } = useDisclosure<string>();

    return (
        <>
            <PbEditorOverrideActionHandlerPlugin
                action={"drop-element"}
                onEditorMount={handler => {
                    // @ts-ignore Type incompatibility. Safe to ignore.
                    const traverser = new ElementTreeTraverser<PbEditorElementTree>();

                    return handler.on(DropElementActionEvent, (async (...params) => {
                        const [state, , args] = params;
                        if (!args) {
                            return DO_NOTHING;
                        }

                        const { target, source } = args;

                        // 1. Handle funnel element drops.
                        if (isFunnelElement(source.type)) {
                            // 1.1 If not a field element, we prevent moving.
                            if (!isFieldElementType(source.type)) {
                                showSnackbar("This element cannot be moved.");
                                return DO_NOTHING;
                            }

                            // 1.2 Check if the funnel element has been dropped outside the container element.
                            const containerElement = await state.getElementById(
                                CONTAINER_ELEMENT_ID
                            );

                            const containerWithDescendants = await state.getElementTree({
                                element: containerElement
                            });

                            let isDroppedWithinContainer = false;
                            traverser.traverse(containerWithDescendants, element => {
                                const isTargetElement = element.id === target.id;
                                if (isTargetElement) {
                                    // The fact that we found the target within the container
                                    // tells us that the field was also dropped within it.
                                    isDroppedWithinContainer = true;
                                    return false;
                                }

                                return;
                            });

                            if (!isDroppedWithinContainer) {
                                showSnackbar("Cannot drop fields outside of the funnel container.");
                                return DO_NOTHING;
                            }

                            // 1.3 Check if the funnel element has been dropped within the success (last) step.
                            const lastStepElementWithDescendants =
                                containerWithDescendants.elements[
                                    containerElement.elements.length - 1
                                ];

                            let isDroppedWithinTheLastStep = false;
                            traverser.traverse(lastStepElementWithDescendants, element => {
                                const isTargetElement = element.id === target.id;
                                if (isTargetElement) {
                                    // The fact that we found the target within the container
                                    // tells us that the field was also dropped within it.
                                    isDroppedWithinTheLastStep = true;
                                    return false;
                                }

                                return;
                            });

                            if (isDroppedWithinTheLastStep) {
                                showSnackbar("Cannot drop fields within the success page.");
                                return DO_NOTHING;
                            }
                        }

                        // 2. We also want to prevent moving the funnel step grid element, which
                        // is the grid that's placed as the first child in every step element.
                        if (source.id) {
                            const movedElement = await state.getElementById(source.id);
                            if (movedElement && movedElement.data.isFunnelStepGrid) {
                                showSnackbar("This element cannot be moved.");
                                return DO_NOTHING;
                            }
                        }

                        return dropElementAction(...params);
                    }) as EventActionCallable<DropElementActionArgsType>);
                }}
            />
            <Snackbar
                message={snackbarMessage}
                open={snackbarShown}
                onClose={hideSnackbar}
                timeout={5000}
            />
        </>
    );
};
