import React, { useCallback, useRef, cloneElement } from "react";
import { getValue } from "./functions/getValue";
import { setValue } from "./functions/setValue";
import { BindComponent, Bind as BaseFormBind } from "@webiny/form";
import { useModelField } from "~/admin/hooks";

interface MemoizedBindComponents {
    [key: string]: BindComponent;
}

const PredefinedValues = () => {
    const { field, fieldPlugin } = useModelField();
    const memoizedBindComponents = useRef<MemoizedBindComponents>({});

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
                            onChange: (value: string[]) => {
                                setValue({ value, bind, index, name });
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

    return <>{fieldPlugin.field.renderPredefinedValues({ getBind })}</>;
};

export default PredefinedValues;
