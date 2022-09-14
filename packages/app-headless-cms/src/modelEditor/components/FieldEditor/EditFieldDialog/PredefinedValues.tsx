import React, { useCallback, useRef, cloneElement } from "react";
import getValue from "./functions/getValue";
import setValue from "./functions/setValue";
import { CmsEditorField, CmsEditorFieldTypePlugin } from "~/types";
import { BindComponent, FormRenderPropParams } from "@webiny/form";

export interface PredefinedValuesProps {
    field: CmsEditorField;
    fieldPlugin: CmsEditorFieldTypePlugin;
    form: FormRenderPropParams;
}
interface MemoizedBindComponents {
    [key: string]: BindComponent;
}

const PredefinedValues: React.FC<PredefinedValuesProps> = ({ field, fieldPlugin, form }) => {
    const memoizedBindComponents = useRef<MemoizedBindComponents>({});
    const { Bind: BaseFormBind } = form;

    const getBind = useCallback((index = -1) => {
        const memoKey = index;
        if (memoizedBindComponents.current[memoKey]) {
            return memoizedBindComponents.current[memoKey];
        }

        const Bind: BindComponent = ({ children, name }) => {
            return (
                <BaseFormBind name={"predefinedValues.values"}>
                    {bind => {
                        const props = {
                            ...bind,
                            value: getValue({ bind, index, name }),
                            onChange: async (value: string[]) => {
                                await setValue({ value, bind, index, name });
                            }
                        };

                        if (typeof children === "function") {
                            return children(props);
                        }

                        return cloneElement(children as unknown as React.ReactElement, props);
                    }}
                </BaseFormBind>
            );
        };

        memoizedBindComponents.current[memoKey] = Bind;

        return memoizedBindComponents.current[memoKey];
    }, []);
    if (!fieldPlugin.field.renderPredefinedValues) {
        return (
            <>{`Missing "field.renderPredefinedValues" method in field type plugin: "${field.type}".`}</>
        );
    }

    return <>{fieldPlugin.field.renderPredefinedValues({ field, getBind, form })}</>;
};

export default PredefinedValues;
