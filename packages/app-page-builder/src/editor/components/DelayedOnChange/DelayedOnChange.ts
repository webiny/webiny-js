import React, { useEffect, useState } from "react";

const emptyFunction = () => {
    return undefined;
};
/**
 * This component is used to wrap Input and Textarea components to optimize form re-render.
 * These 2 are the only components that trigger form model change on each character input.
 * This means, whenever you type a letter an entire form re-renders.
 * On complex forms you will feel and see a significant delay if this component is not used.
 *
 * The logic behind this component is to serve as a middleware between Form and Input/Textarea, and only notify form of a change when
 * a user stops typing for given period of time (400ms by default).
 */
type Props = {
    value: string;
    delay?: number;
    onChange: Function;
    onBlur?: Function;
    onKeyDown?: Function;
};
export const DelayedOnChange: React.FunctionComponent<Props> = ({
    children,
    onChange,
    delay = 400,
    value: initialValue,
    ...other
}) => {
    const [value, setValue] = useState<string>(initialValue);

    const localTimeout = React.useRef<number>(undefined);

    const applyValue = React.useCallback((value: any, callback: Function = emptyFunction) => {
        return () => {
            localTimeout.current && clearTimeout(localTimeout.current);
            localTimeout.current = null;
            onChange(value, callback);
        };
    }, []);

    const onChangeLocal = React.useCallback((value: string) => {
        return () => {
            setValue(() => {
                return value;
            });
            // class component could have fired callback on setState - there is no such thing in function component
            // we have useEffect that fires on value change and if value is not undefined
        };
    }, []);

    // this is fired upon change value state
    const onValueStateChanged = React.useCallback(() => {
        return () => {
            localTimeout.current && clearTimeout(localTimeout.current);
            localTimeout.current = null;
            localTimeout.current = (setTimeout(
                () => applyValue(value),
                delay
            ) as unknown) as number;
        };
    }, []);

    // need to clear the timeout when unmounting the component
    useEffect(() => {
        return () => {
            if (!localTimeout.current) {
                return;
            }
            clearTimeout(localTimeout.current);
            localTimeout.current = null;
        };
    });

    // must not fire on first render of the component
    // we will know that if localTimeout is undefined
    // at every other point it will be null or a number
    useEffect(() => {
        if (localTimeout.current === undefined) {
            return;
        }
        onValueStateChanged();
    }, [value]);

    const newProps = {
        ...other,
        value: value,
        onChange: onChangeLocal
    };

    const renderProp = typeof children === "function" ? children : false;
    const child = renderProp
        ? renderProp(newProps)
        : React.cloneElement(children as React.ReactElement, newProps);

    const props = { ...child.props };
    const realOnKeyDown = props.onKeyDown || emptyFunction;
    const realOnBlur = props.onBlur || emptyFunction;

    // Need to apply value if input lost focus
    props.onBlur = e => {
        e.persist();
        applyValue(e.target.value, () => realOnBlur(e));
    };

    // Need to listen for TAB key to apply new value immediately, without delay. Otherwise validation will be triggered with old value.
    props.onKeyDown = e => {
        e.persist();
        if (e.key === "Tab") {
            applyValue(e.target.value, () => realOnKeyDown(e));
        } else if (e.key === "Enter" && props["data-on-enter"]) {
            applyValue(e.target.value, () => realOnKeyDown(e));
        } else {
            realOnKeyDown(e);
        }
    };

    return React.cloneElement(child, props);
};

export default DelayedOnChange;
