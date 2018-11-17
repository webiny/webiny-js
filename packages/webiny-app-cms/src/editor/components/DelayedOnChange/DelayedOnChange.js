// @flow
import * as React from "react";
import _ from "lodash";

/**
 * This component is used to wrap Input and Textarea components to optimize form re-render.
 * These 2 are the only components that trigger form model change on each character input.
 * This means, whenever you type a letter an entire form re-renders.
 * On complex forms you will feel and see a significant delay if this component is not used.
 *
 * The logic behind this component is to serve as a middleware between Form and Input/Textarea, and only notify form of a change when
 * a user stops typing for given period of time (400ms by default).
 */
class DelayedOnChange extends React.Component<*, *> {
    static defaultProps = {
        delay: 400
    };

    delay = null;
    state = { value: "" };

    componentDidMount() {
        this.setState({ value: this.props.value });
    }

    applyValue = (value: any, callback: Function = _.noop) => {
        this.delay && clearTimeout(this.delay);
        this.delay = null;
        this.props.onChange(value, callback);
    };

    onChange = (value: any) => {
        this.setState({ value }, this.changed);
    };

    changed = () => {
        this.delay && clearTimeout(this.delay);
        this.delay = null;
        this.delay = setTimeout(() => this.applyValue(this.state.value), this.props.delay);
    };

    render() {
        const { children, ...other } = this.props;
        const newProps = {
            ...other,
            value: this.state.value,
            onChange: this.onChange
        };

        const renderProp = typeof children === "function" ? children : false;
        const child = renderProp ? renderProp(newProps) : React.cloneElement(children, newProps);

        const props = { ...child.props };
        const realOnKeyDown = props.onKeyDown || _.noop;
        const realOnBlur = props.onBlur || _.noop;

        // Need to apply value if input lost focus
        props.onBlur = e => {
            e.persist();
            this.applyValue(e.target.value, () => realOnBlur(e));
        };

        // Need to listen for TAB key to apply new value immediately, without delay. Otherwise validation will be triggered with old value.
        props.onKeyDown = e => {
            e.persist();
            if (e.key === "Tab") {
                this.applyValue(e.target.value, () => realOnKeyDown(e));
            } else if (e.key === "Enter" && props["data-on-enter"]) {
                this.applyValue(e.target.value, () => realOnKeyDown(e));
            } else {
                realOnKeyDown(e);
            }
        };

        return React.cloneElement(child, props);
    }
}

export default DelayedOnChange;
