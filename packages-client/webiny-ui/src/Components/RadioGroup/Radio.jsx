import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Radio extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.id = _.uniqueId('radio-');
        this.bindMethods('onChange');
    }

    onChange() {
        this.props.onChange(this.props.option);
    }

    renderLabel() {
        return this.props.labelRenderer.call(this, {option: this.props.option, radio: this});
    }
}

Radio.defaultProps = {
    disabled: false,
    label: '',
    className: '',
    option: null,
    optionIndex: null,
    value: false,
    labelRenderer({radio}) {
        return radio.props.label;
    },
    renderer() {
        const css = this.classSet(this.props.styles.radio, this.props.className, 'col-sm-' + this.props.grid);

        return (
            <div className={css}>
                <input type="radio" disabled={this.props.disabled} onChange={this.onChange} checked={this.props.value} id={this.id}/>
                <label htmlFor={this.id}>{this.renderLabel()}</label>
            </div>
        );
    }
};

export default Webiny.createComponent(Radio, {styles});