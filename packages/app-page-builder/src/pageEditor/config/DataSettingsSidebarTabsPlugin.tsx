import React, { useCallback } from "react";
import styled from "@emotion/styled";
import { merge } from "dot-prop-immutable";

import { createComponentPlugin } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { Tab } from "@webiny/ui/Tabs";
import { Form, FormOnSubmit } from "@webiny/form";
import { renderPlugins } from "@webiny/app/plugins";

import { EditorSidebarTabs } from "~/editor";
import { createElement } from "~/editor/helpers";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useDynamicParent } from "~/editor/hooks/useDynamicParent";
import { useElementWithChildrenById, useElementById } from "~/editor/hooks/useElementById";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { useUnlinkBlockDynamic } from "~/editor/hooks/useUnlinkDynamicSource";
import { CloneElementActionEvent } from "~/editor/recoil/actions/cloneElement";
import {
    PbEditorPageElementDataSettingsPlugin,
    PbEditorPageElementParentDataSettingsPlugin,
    PbEditorPageElementPlugin,
    PbElement
} from "~/types";
import { PbEditorElement } from "~/types";

const TabContentWrapper = styled.div`
    height: calc(100vh - 65px - 48px); // Subtract top-bar and tab-header height
    overflow-y: auto;
    // Style scrollbar
    &::-webkit-scrollbar {
        width: 1px;
    }
    &::-webkit-scrollbar-track {
        box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    }
    &::-webkit-scrollbar-thumb {
        background-color: darkgrey;
        outline: 1px solid slategrey;
    }
`;

export const DataSettingsSidebarTabsPlugin = createComponentPlugin(EditorSidebarTabs, Tabs => {
    return function ElementTab({ children, ...props }) {
        const [element, setActiveElement] = useActiveElement();
        const dynamicParent = useDynamicParent(element?.id);
        const parentElement = useElementWithChildrenById(element?.parent || null);
        const [parentPbElement] = useElementById(element?.parent || null);
        const documentElement = useElementWithChildrenById(parentElement?.parent || null);
        const updateElement = useUpdateElement();
        const { onUnlink, onChange } = useUnlinkBlockDynamic();
        const { getElementTree, trigger } = useEventActionHandler();

        const elementType =
            element?.type === "block" || element?.type === "carousel" ? "block" : "element";
        const variantBlock = parentElement?.data?.isVariantBlock ? parentElement : null;

        const onSubmit: FormOnSubmit = async formData => {
            const settingsPlugins = plugins
                .byType<PbEditorPageElementDataSettingsPlugin>(
                    "pb-editor-page-element-data-settings"
                )
                .filter(pl => pl.elementType === elementType);

            let modifiedFormData = formData;
            for (const plugin of settingsPlugins) {
                if (typeof plugin?.onSave === "function") {
                    modifiedFormData = await plugin.onSave(modifiedFormData);
                }
            }

            updateElement(merge(variantBlock || element, "data", modifiedFormData));
        };

        const destroyVariantBlock = useCallback(() => {
            if (!documentElement || !parentElement) {
                return;
            }

            const parentBlockIndex = (documentElement.elements as PbEditorElement[]).findIndex(
                el => el.id === parentElement.id
            );

            if (parentBlockIndex !== -1) {
                const variants = (parentElement.elements as PbEditorElement[]).map(variant => ({
                    ...variant,
                    data: { settings: variant.data.settings },
                    parent: documentElement.id
                }));
                const documentElements = [...documentElement.elements];
                documentElements.splice(parentBlockIndex, 1, ...variants);

                updateElement({ ...documentElement, elements: documentElements });
            }
        }, [documentElement, parentElement]);

        const onUnlinkDynamic = useCallback(() => {
            if (parentElement?.data?.isVariantBlock) {
                destroyVariantBlock();
            } else {
                onUnlink(element);
            }
        }, [element, parentElement, destroyVariantBlock, onUnlink]);

        const onChangeDynamic = useCallback(
            (modelId: string) => {
                if (parentPbElement?.data?.isVariantBlock) {
                    onChange(parentPbElement, modelId);
                } else {
                    onChange(element, modelId);
                }
            },
            [element, parentPbElement, onChange]
        );

        const addVariant = useCallback(async () => {
            if (!element) {
                return;
            }

            if (element.data.conditions) {
                trigger(
                    new CloneElementActionEvent({
                        element: { ...element, data: { ...element.data, conditions: [] } }
                    })
                );
            } else {
                const elementTree = await getElementTree({ element });
                const variant = createElement("block", {
                    elements: elementTree.elements,
                    data: { settings: elementTree.data?.settings || {}, conditions: [] },
                    parent: elementTree.id
                });

                updateElement({
                    ...element,
                    data: {
                        ...element.data,
                        selectedVariantId: variant.id,
                        isVariantBlock: true
                    },
                    elements: [variant]
                });
                setActiveElement(variant.id);
            }
        }, [element]);

        const removeVariant = useCallback(
            async index => {
                if (!variantBlock) {
                    return;
                }
                if (variantBlock.elements.length === 1) {
                    const elementTree = await getElementTree({
                        element: variantBlock.elements[0] as PbEditorElement
                    });
                    // Remove isVariantBlock from data when deleting last variant
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { isVariantBlock, ...variantBlockData } = variantBlock.data;

                    updateElement({
                        ...variantBlock,
                        data: { ...variantBlockData, settings: elementTree.data.settings },
                        elements: elementTree.elements
                    });
                    setActiveElement(variantBlock.id);
                } else {
                    const newArray = [...variantBlock.elements];
                    newArray.splice(index, 1);
                    const deletedVariantId = (variantBlock.elements as PbEditorElement[])[index].id;

                    if (variantBlock.data?.selectedVariantId === deletedVariantId) {
                        const selectedVariantId =
                            (variantBlock.elements as PbEditorElement[])?.find(
                                variant => variant.id !== deletedVariantId
                            )?.id || variantBlock.id;

                        updateElement({
                            ...variantBlock,
                            data: {
                                ...variantBlock.data,
                                selectedVariantId
                            },
                            elements: newArray
                        });
                        setActiveElement(selectedVariantId);
                    } else {
                        updateElement({
                            ...variantBlock,
                            elements: newArray
                        });
                    }
                }
            },
            [variantBlock]
        );

        const onParentSubmit: FormOnSubmit = async formData => {
            const settingsPlugins = plugins
                .byType<PbEditorPageElementDataSettingsPlugin>(
                    "pb-editor-page-element-data-settings"
                )
                .filter(pl => pl.elementType === elementType);

            let modifiedFormData = formData;
            for (const plugin of settingsPlugins) {
                if (typeof plugin?.onSave === "function") {
                    modifiedFormData = await plugin.onSave(modifiedFormData);
                }
            }

            updateElement(modifiedFormData as PbElement);

            if (variantBlock?.data?.selectedVariantId !== modifiedFormData.data.selectedVariantId) {
                setActiveElement(modifiedFormData.data.selectedVariantId);
            }
        };

        if (!element) {
            return <Tabs {...props}>{children}</Tabs>;
        }

        const [pageElementPlugin] = plugins
            .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
            .filter(pl => pl.elementType === element?.type);

        const modelId = dynamicParent?.data?.dynamicSource?.modelId;
        const isNotReferenceBlock = element.type === "block" && !element.data.blockId;
        const canHaveDynamicSource = pageElementPlugin.allowDynamicSource && modelId;

        return (
            <Tabs {...props}>
                {element.type === "carousel" || isNotReferenceBlock || canHaveDynamicSource ? (
                    <>
                        {children}
                        <Tab label={"Data"}>
                            <TabContentWrapper>
                                <Form
                                    data={variantBlock?.data || element?.data}
                                    onSubmit={onSubmit}
                                >
                                    {formProps => (
                                        <>
                                            {renderPlugins<PbEditorPageElementDataSettingsPlugin>(
                                                "pb-editor-page-element-data-settings",
                                                {
                                                    ...formProps,
                                                    sourceModelId: modelId,
                                                    onUnlink: onUnlinkDynamic,
                                                    onChangeSource: onChangeDynamic,
                                                    allowedFields: pageElementPlugin?.allowedFields
                                                },
                                                {
                                                    wrapper: false,
                                                    filter: pl => pl.elementType === elementType
                                                }
                                            )}
                                        </>
                                    )}
                                </Form>
                                <Form data={variantBlock || element} onSubmit={onParentSubmit}>
                                    {formProps => (
                                        <>
                                            {renderPlugins<PbEditorPageElementParentDataSettingsPlugin>(
                                                "pb-editor-page-element-parent-data-settings",
                                                {
                                                    ...formProps,
                                                    sourceModelId: modelId,
                                                    allowedFields: pageElementPlugin?.allowedFields,
                                                    addVariant,
                                                    removeVariant
                                                },
                                                {
                                                    wrapper: false,
                                                    filter: pl => pl.elementType === elementType
                                                }
                                            )}
                                        </>
                                    )}
                                </Form>
                            </TabContentWrapper>
                        </Tab>
                    </>
                ) : (
                    children
                )}
            </Tabs>
        );
    };
});
