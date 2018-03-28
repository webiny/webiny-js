import React from 'react';
import _ from 'lodash';
import classSet from "classnames";
import { createComponent } from 'webiny-app';
import styles from './styles.css';

class Radio extends React.Component {

    constructor(props) {
        super(props);

        this.id = _.uniqueId('radio-');
        this.onChange = this.onChange.bind(this);
    }

    onChange() {
        this.props.onChange(this.props.option);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const css = classSet(this.props.styles.radio, this.props.className, 'col-sm-' + this.props.grid);

        return (
            <div className={css}>
                <input
                    type="radio"
                    disabled={this.props.disabled}
                    onChange={this.onChange}
                    checked={this.props.value}
                    id={this.id}/>
                <label htmlFor={this.id}>{this.props.renderLabel.call(this)}</label>
            </div>
        );
    }
}

Radio.defaultProps = {
    disabled: false,
    label: '',
    className: '',
    option: null,
    optionIndex: null,
    value: false,
    renderLabel() {
        return this.props.label;
    }
};

export default createComponent(Radio, { styles });