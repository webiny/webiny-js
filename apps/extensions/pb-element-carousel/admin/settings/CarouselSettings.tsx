import React from "react";
import { css } from "emotion";
import dotProp from "dot-prop-immutable";
import { Grid, Cell } from "@webiny/ui/Grid";
import { PbEditorPageElementSettingsRenderComponentProps } from "@webiny/app-page-builder/types";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/hooks/useEventActionHandler";
import { createElement } from "@webiny/app-page-builder/editor/helpers";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
// Components
import {
    ContentWrapper,
    SimpleButton
} from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import Accordion from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Accordion";
import { useActiveElement } from "@webiny/app-page-builder/editor/hooks/useActiveElement";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    icon: css({
        "&.mdc-button__icon": {
            width: "14px",
            height: "14px"
        }
    })
};

export const CarouselSettings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps> =
    ({ defaultAccordionValue }) => {
        const handler = useEventActionHandler();
        const [activeElement] = useActiveElement();

        const deleteItem = index => {
            if (index >= activeElement.elements.length || index < 0) {
                return;
            }
            const newElement = dotProp.set(
                activeElement,
                "elements",
                dotProp.delete(activeElement.elements, index)
            );
            handler.trigger(
                new UpdateElementActionEvent({
                    element: newElement,
                    history: true
                })
            );
        };

        const removeElementFromEnd = () => {
            deleteItem(activeElement.elements.length - 1);
        };

        const addNewElementToEnd = () => {
            const newElement = dotProp.set(activeElement, "elements", [
                ...activeElement.elements,
                createElement("cell", {
                    data: {
                        settings: {
                            grid: {
                                size: 12
                            }
                        }
                    }
                })
            ]);
            handler.trigger(
                new UpdateElementActionEvent({
                    element: newElement,
                    history: true
                })
            );
        };

        return (
            <Accordion title={"Carousel"} defaultValue={defaultAccordionValue}>
                <ContentWrapper direction={"column"}>
                    <Grid className={classes.grid}>
                        <Cell span={6}>
                            <SimpleButton
                                disabled={activeElement.elements.length === 0}
                                onClick={removeElementFromEnd}
                            >
                                Remove Item
                            </SimpleButton>
                        </Cell>
                        <Cell span={6}>
                            <SimpleButton onClick={addNewElementToEnd}>Add Item</SimpleButton>
                        </Cell>
                    </Grid>
                </ContentWrapper>
            </Accordion>
        );
    };
