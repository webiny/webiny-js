import React from "react";
import { css } from "emotion";
import dotProp from "dot-prop-immutable";
import { useRecoilValue } from "recoil";
import { Grid, Cell } from "@webiny/ui/Grid";
import {
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorElement
} from "@webiny/app-page-builder/types";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/hooks/useEventActionHandler";
import { createElement } from "@webiny/app-page-builder/editor/helpers";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import {
    activeElementAtom,
    elementWithChildrenByIdSelector
} from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import {
    ContentWrapper,
    SimpleButton
} from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import Accordion from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Accordion";

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

export const CarouselSettings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const handler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = (useRecoilValue(
        elementWithChildrenByIdSelector(activeElementId)
    ) as unknown) as PbEditorElement;

    const deleteItem = index => {
        if (index >= element.elements.length || index < 0) {
            return;
        }
        handler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...(element.data.settings || {})
                        }
                    },
                    elements: dotProp.delete(element.elements, index)
                },
                history: true
            })
        );
    };

    const removeElementFromEnd = () => {
        deleteItem(element.elements.length - 1);
    };

    const addNewElementToEnd = () => {
        handler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...(element.data.settings || {})
                        }
                    },
                    elements: dotProp.set(
                        element.elements,
                        element.elements.length,
                        createElement("cell", {
                            data: {
                                settings: {
                                    grid: {
                                        size: 12
                                    }
                                }
                            }
                        })
                    )
                },
                history: true
            })
        );
    };

    return (
        <Accordion title={"Carousel"} defaultValue={defaultAccordionValue}>
            <ContentWrapper direction={"column"}>
                <Grid className={classes.grid}>
                    <Cell span={6}>
                        <SimpleButton onClick={removeElementFromEnd}>Remove Item</SimpleButton>
                    </Cell>
                    <Cell span={6}>
                        <SimpleButton onClick={addNewElementToEnd}>Add Item</SimpleButton>
                    </Cell>
                </Grid>
            </ContentWrapper>
        </Accordion>
    );
};
