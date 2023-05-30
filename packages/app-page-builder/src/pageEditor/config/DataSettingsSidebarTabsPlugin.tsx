import React from "react";
import styled from "@emotion/styled";
import { merge } from "dot-prop-immutable";

import { createComponentPlugin } from "@webiny/app-admin";
import { plugins } from "@webiny/plugins";
import { Tab } from "@webiny/ui/Tabs";
import { Form, FormOnSubmit } from "@webiny/form";
import { renderPlugins } from "@webiny/app/plugins";

import { EditorSidebarTabs } from "~/editor";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useDynamicParent } from "~/editor/hooks/useDynamicParent";
import { useUnlinkBlockDynamic } from "~/editor/hooks/useUnlinkDynamicSource";
import { PbEditorPageElementDataSettingsPlugin, PbEditorPageElementPlugin } from "~/types";

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
        const [element] = useActiveElement();
        const [pageElementPlugin] = plugins
            .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
            .filter(pl => pl.elementType === element?.type);
        const dynamicParent = useDynamicParent(element?.id);
        const updateElement = useUpdateElement();
        const { onUnlink } = useUnlinkBlockDynamic({ element });
        const elementType =
            element?.type === "block" || element?.type === "carousel" ? "block" : "element";

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

            updateElement(merge(element, "data", modifiedFormData));
        };

        if (!element) {
            return <Tabs {...props}>{children}</Tabs>;
        }

        const canHaveDynamicSource =
            pageElementPlugin.allowDynamicSource && dynamicParent?.data?.dynamicSource?.modelId;

        return (
            <Tabs {...props}>
                {element.type === "block" ||
                element?.type === "carousel" ||
                canHaveDynamicSource ? (
                    <>
                        {children}
                        <Tab label={"Data"}>
                            <Form
                                key={element && element.id}
                                data={element.data}
                                onSubmit={onSubmit}
                            >
                                {formProps => (
                                    <TabContentWrapper>
                                        {renderPlugins<PbEditorPageElementDataSettingsPlugin>(
                                            "pb-editor-page-element-data-settings",
                                            {
                                                ...formProps,
                                                sourceModelId:
                                                    dynamicParent?.data?.dynamicSource?.modelId,
                                                onUnlink,
                                                allowedFields: pageElementPlugin?.allowedFields
                                            },
                                            {
                                                wrapper: false,
                                                filter: pl => pl.elementType === elementType
                                            }
                                        )}
                                    </TabContentWrapper>
                                )}
                            </Form>
                        </Tab>
                    </>
                ) : (
                    children
                )}
            </Tabs>
        );
    };
});
