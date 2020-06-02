import React, { useCallback, useRef, cloneElement } from "react";
import getValue from "./functions/getValue";
import setValue from "./functions/setValue";

export default function PredefinedValues({ locale, field, fieldPlugin, form }) {
    const memoizedBindComponents = useRef({});
    const { Bind: BaseFormBind } = form;

    const getBind = useCallback(
        (index = -1) => {
            const memoKey = locale + index;
            if (memoizedBindComponents.current[memoKey]) {
                return memoizedBindComponents.current[memoKey];
            }

            memoizedBindComponents.current[memoKey] = function Bind({ children, name }) {
                return (
                    <BaseFormBind name={"predefinedValues.values"}>
                        {bind => {
                            const value = getValue({ bind, locale, index, name });
                            const onChange = value =>
                                setValue({ value, bind, locale, index, name });

                            const props = {
                                ...bind,
                                value,
                                onChange
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
        },
        [locale]
    );

    return fieldPlugin.field.renderPredefinedValues({ field, getBind, locale });
}
