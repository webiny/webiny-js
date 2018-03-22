import React from 'react';
import _ from 'lodash';

/**
 * This component is used to wrap Input and Textarea components to optimize form re-render.
 * These 2 are the only components that trigger form model change on each character input.
 * This means, whenever you type a letter an entire form re-renders.
 * On complex forms you will feel and see a significant delay if this component is not used.
 *
 * The logic behind this component is to serve as a middleware between Form and Input/Textarea, and only notify form of a change when
 * a user stops typing for given period of time (400ms by default).
 */
class DelayedOnChange extends React.Component {

    constructor(props) {
        super(props);

        this.delay = null;
        this.state = {
            value: this.getChildElement(props).props.value
        };

        this.applyValue = this.applyValue.bind(this);
        this.changed = this.changed.bind(this);
    }

    componentWillReceiveProps(props) {
        if (!this.delay) {
            this.setState({ value: this.getChildElement(props).props.value });
        }
    }

    applyValue(value, callback = _.noop) {
        clearTimeout(this.delay);
        this.delay = null;
        this.realOnChange(value, callback);
    }

    changed() {
        clearTimeout(this.delay);
        this.delay = null;
        this.delay = setTimeout(() => this.applyValue(this.state.value), this.props.delay);
    }

    getChildElement(props = null) {
        if (!props) {
            props = this.props;
        }

        return React.Children.toArray(props.children)[0];
    }

    render() {
        const childElement = this.getChildElement();
        this.realOnChange = childElement.props.onChange;
        const props = _.omit(childElement.props, ['onChange']);
        props.value = this.state.value;
        props.onChange = e => {
            const value = _.isString(e) ? e : e.target.value;
            this.setState({ value }, this.changed);
        };
        const realOnKeyDown = props.onKeyDown || _.noop;
        const realOnBlur = props.onBlur || _.noop;
        
        // Need to apply value if input lost focus
        props.onBlur = (e) => {
            e.persist();
            this.applyValue(e.target.value, () => realOnBlur(e));
        };

        // Need to listen for TAB key to apply new value immediately, without delay. Otherwise validation will be triggered with old value.
        props.onKeyDown = (e) => {
            e.persist();
            if (e.key === 'Tab') {
                this.applyValue(e.target.value, () => realOnKeyDown(e));
            } else if (e.key === 'Enter' && props['data-on-enter']) {
                this.applyValue(e.target.value, () => realOnKeyDown(e));
            } else {
                realOnKeyDown(e);
            }
        };

        return React.cloneElement(childElement, props);
    }
}

DelayedOnChange.defaultProps = {
    delay: 400
};

export default DelayedOnChange;