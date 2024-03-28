import * as React from "react";
import noop from "lodash/noop";

/**
 * This component is used to wrap Input and Textarea components to optimize form re-render.
 * These 2 are the only components that trigger form model change on each character input.
 * This means, whenever you type a letter an entire form re-renders.
 * On complex forms you will feel and see a significant delay if this component is not used.
 *
 * The logic behind this component is to serve as a middleware between Form and Input/Textarea, and only notify form of a change when
 * a user stops typing for given period of time (400ms by default).
 */
export interface OnChangeCbCallable {
    (value: string): void;
}
export interface OnChangeCallable {
    (value: string, cb?: OnChangeCbCallable): void;
}
interface ChildrenParams {
    value: string;
    onChange: OnChangeCallable;
}
interface DelayedOnChangeProps {
    delay?: number;
    value?: string;
    onChange: OnChangeCallable;
    onKeyDown?: (ev: React.SyntheticEvent) => void;
    onBlur?: (ev: React.SyntheticEvent) => void;
    children: (params: ChildrenParams) => React.ReactElement;
}
interface DelayedOnChangeState {
    value?: string;
}
class DelayedOnChange extends React.Component<DelayedOnChangeProps, DelayedOnChangeState> {
    static defaultProps: Partial<DelayedOnChangeProps> = {
        delay: 400
    };

    private delay: number | null = null;

    public override readonly state: DelayedOnChangeState = {
        value: ""
    };

    public override componentDidMount() {
        this.setState({ value: this.props.value });
    }

    private applyValue = (value: any, callback: OnChangeCbCallable = noop): void => {
        this.delay && clearTimeout(this.delay);
        this.delay = null;
        this.props.onChange(value, callback);
    };

    private onChange = (value: string): void => {
        this.setState({ value }, this.changed);
    };

    private changed = (): void => {
        this.delay && clearTimeout(this.delay);
        this.delay = null;
        this.delay = setTimeout(
            () => this.applyValue(this.state.value),
            this.props.delay
        ) as unknown as number;
    };

    public override render(): React.ReactNode {
        const { children, ...other } = this.props;
        const newProps: Omit<DelayedOnChangeProps, "children"> = {
            ...other,
            value: this.state.value,
            onChange: this.onChange
        };

        const renderProp = typeof children === "function" ? children : false;
        const child = renderProp
            ? renderProp(newProps as Required<DelayedOnChangeProps>)
            : React.cloneElement(children as unknown as React.ReactElement, newProps);

        const props = { ...child.props };
        const realOnKeyDown = props.onKeyDown || noop;
        const realOnBlur = props.onBlur || noop;

        // Need to apply value if input lost focus
        props.onBlur = (ev: React.SyntheticEvent) => {
            ev.persist();
            this.applyValue((ev.target as HTMLInputElement).value, () => realOnBlur(ev));
        };

        // Need to listen for TAB key to apply new value immediately, without delay. Otherwise validation will be triggered with old value.
        props.onKeyDown = (ev: React.KeyboardEvent) => {
            ev.persist();
            if (ev.key === "Tab") {
                this.applyValue((ev.target as HTMLInputElement).value, () => realOnKeyDown(ev));
            } else if (ev.key === "Enter" && props["data-on-enter"]) {
                this.applyValue((ev.target as HTMLInputElement).value, () => realOnKeyDown(ev));
            } else {
                realOnKeyDown(ev);
            }
        };

        return React.cloneElement(child, props);
    }
}

export default DelayedOnChange;
