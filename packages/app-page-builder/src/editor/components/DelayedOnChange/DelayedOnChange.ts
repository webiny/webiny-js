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
    value?: string;
    delay?: number;
    onChange?: Function;
    onBlur?: Function;
    onKeyDown?: Function;
};
export const DelayedOnChange: React.FunctionComponent<Props> = ({ children, ...other }) => {
    const { onChange, delay = 400, value: initialValue } = other;
    const [value, setValue] = useState<string>(initialValue);

    const localTimeout = React.useRef<number>(undefined);

    const applyValue = (value: any, callback: Function = emptyFunction) => {
        localTimeout.current && clearTimeout(localTimeout.current);
        localTimeout.current = null;
        onChange(value, callback);
    };

    const onChangeLocal = React.useCallback((value: string) => {
        setValue(value);
    }, []);

    // this is fired upon change value state
    const onValueStateChanged = (nextValue: string) => {
        localTimeout.current && clearTimeout(localTimeout.current);
        localTimeout.current = null;
        localTimeout.current = (setTimeout(
            () => applyValue(nextValue),
            delay
        ) as unknown) as number;
    };

    // need to clear the timeout when unmounting the component
    useEffect(() => {
        return () => {
            if (!localTimeout.current) {
                return;
            }
            clearTimeout(localTimeout.current);
            localTimeout.current = null;
        };
    }, []);

    useEffect(() => {
        onValueStateChanged(value);
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
    const onBlur = e => {
        e.persist();
        applyValue(e.target.value, () => realOnBlur(e));
    };

    // Need to listen for TAB key to apply new value immediately, without delay. Otherwise validation will be triggered with old value.
    const onKeyDown = e => {
        e.persist();
        if (e.key === "Tab") {
            applyValue(e.target.value, () => realOnKeyDown(e));
        } else if (e.key === "Enter" && props["data-on-enter"]) {
            applyValue(e.target.value, () => realOnKeyDown(e));
        } else {
            realOnKeyDown(e);
        }
    };

    return React.cloneElement(child, { ...props, onBlur, onKeyDown });
};

export default DelayedOnChange;
