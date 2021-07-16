import React, { useCallback, useRef, cloneElement } from "react";
import getValue from "./functions/getValue";
import setValue from "./functions/setValue";

export default function PredefinedValues({ field, fieldPlugin, form }) {
    const memoizedBindComponents = useRef({});
    const { Bind: BaseFormBind } = form;

    const getBind = useCallback((index = -1) => {
        const memoKey = index;
        if (memoizedBindComponents.current[memoKey]) {
            return memoizedBindComponents.current[memoKey];
        }

        memoizedBindComponents.current[memoKey] = function Bind({ children, name }) {
            return (
                <BaseFormBind name={"predefinedValues.values"}>
                    {bind => {
                        const props = {
                            ...bind,
                            value: getValue({ bind, index, name }),
                            onChange: value => {
                                setValue({ value, bind, index, name });
                            }
                        };

                        if (typeof children === "function") {
                            return children(props);
                        }

                        return cloneElement(children, props);
                    }}
                </BaseFormBind>
            );
        };

        return memoizedBindComponents.current[memoKey];
    }, []);

    return fieldPlugin.field.renderPredefinedValues({ field, getBind });
}
