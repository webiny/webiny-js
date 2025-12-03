import React, { useState } from "react";

import { generateAlphaNumericLowerCaseId } from "@webiny/utils";
import { Cell } from "@webiny/ui/Grid/index.js";
import { useConfirmationDialog } from "@webiny/app-admin";
import type {
    BindComponentRenderProp,
    CmsModelFieldRendererProps
} from "@webiny/app-headless-cms-common/types/index.js";
import { MultiValueItemContainer } from "~/admin/plugins/fieldRenderers/object/MultiValueItemContainer.js";
import { Fields } from "~/admin/components/ContentEntryForm/Fields.js";
import DynamicSection from "~/admin/plugins/fieldRenderers/DynamicSection.js";
import {
    dynamicSectionGridStyle,
    fieldsGridStyle,
    ItemHighLight,
    ObjectItem
} from "~/admin/plugins/fieldRenderers/object/StyledComponents.js";
import { FieldSettings } from "~/admin/plugins/fieldRenderers/object/FieldSettings.js";
import { useModelField } from "~/admin/components/ModelFieldProvider/index.js";
import { useModel } from "~/admin/components/ModelProvider/index.js";

type GetBind = CmsModelFieldRendererProps["getBind"];

export interface MultiValueContainerProps {
    bind: BindComponentRenderProp;
    getBind: GetBind;
    showTitle?: boolean;
}

export const MultiValueContainer = (props: MultiValueContainerProps) => {
    const [highlightMap, setHighlightIndex] = useState<{ [key: number]: string }>({});
    const [itemState, setItemState] = useState<{ [key: number]: boolean }>({});

    const { model } = useModel();
    const { field } = useModelField();

    const { showConfirmation } = useConfirmationDialog({
        message: `Are you sure you want to delete this item? This action is not reversible.`,
        acceptLabel: `Yes, I'm sure!`,
        cancelLabel: `No, leave it.`
    });

    const fieldSettings = FieldSettings.createFrom(field);

    if (!fieldSettings.hasFields()) {
        fieldSettings.logMissingFields();
        return null;
    }

    const toggleItemState = (index: number) => {
        setItemState(state => ({ ...state, [index]: !state[index] }));
    };

    const onAddItem = (index: number) => {
        setItemState(state => ({ ...state, [index]: true }));
    };

    const settings = fieldSettings.getSettings();

    return (
        <DynamicSection
            {...props}
            showLabel={props.showTitle}
            field={field}
            emptyValue={{}}
            onAddItem={onAddItem}
            gridClassName={dynamicSectionGridStyle}
        >
            {({ Bind, bind, index }) => {
                const onMoveDown = () => {
                    bind.field.moveValueDown(index);

                    setHighlightIndex(map => ({
                        ...map,
                        [index + 1]: generateAlphaNumericLowerCaseId(12)
                    }));

                    setItemState(state => {
                        return {
                            ...state,
                            [index + 1]: state[index] ?? false,
                            [index]: state[index + 1] ?? false
                        };
                    });
                };

                const onMoveUp = () => {
                    bind.field.moveValueUp(index);

                    setHighlightIndex(map => ({
                        ...map,
                        [index - 1]: generateAlphaNumericLowerCaseId(12)
                    }));

                    setItemState(state => {
                        return {
                            ...state,
                            [index - 1]: state[index] ?? false,
                            [index]: state[index - 1] ?? false
                        };
                    });
                };

                const onDelete = () => {
                    showConfirmation(() => {
                        bind.field.removeValue(index);
                    });
                };

                return (
                    <ObjectItem>
                        {highlightMap[index] ? <ItemHighLight key={highlightMap[index]} /> : null}
                        <MultiValueItemContainer
                            value={bind.index.value}
                            title={`${field.label} #${index + 1}`}
                            isFirst={index === 0}
                            isLast={index === bind.field.value.length - 1}
                            onMoveUp={onMoveUp}
                            onMoveDown={onMoveDown}
                            onDelete={onDelete}
                            isExpanded={itemState[index] ?? false}
                            toggleExpanded={() => toggleItemState(index)}
                        >
                            <Cell span={12}>
                                <Fields
                                    Bind={Bind}
                                    contentModel={model}
                                    fields={settings.fields}
                                    layout={settings.layout}
                                    gridClassName={fieldsGridStyle}
                                />
                            </Cell>
                        </MultiValueItemContainer>
                    </ObjectItem>
                );
            }}
        </DynamicSection>
    );
};
