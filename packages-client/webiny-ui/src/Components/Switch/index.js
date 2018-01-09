import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class Switch extends Webiny.Ui.FormComponent {
    constructor(props) {
        super(props);

        this.bindMethods('switch');
    }

    componentWillMount() {
        super.componentWillMount();
        this.id = _.uniqueId('switch-');
    }

    switch() {
        if (this.isDisabled()) {
            return;
        }
        const el = ReactDOM.findDOMNode(this).querySelector('input');
        const checked = !el.checked;
        this.props.onChange(checked);
    }
}

Switch.defaultProps = Webiny.Ui.FormComponent.extendProps({
    style: {},
    renderer() {
        const {FormGroup, styles} = this.props;
        let classes = this.classSet(styles.switch, styles.switchInline);
        if (this.props.disabled) {
            classes += ' ' + styles.disabled;
        }

        // The JSON.parse was added since sometimes value can come in as a string (eg. when value is coming from URL, as a query parameter).
        // With the JSON.parse, we ensure we get non-string, pure boolean value, and that the switch button is correctly rendered.
        const value = JSON.parse(this.props.value || null);

        return (
            <FormGroup>
                {this.renderLabel()}
                <div className="clearfix"/>
                <div className={classes}>
                    <input id={this.id} type="checkbox" readOnly checked={value === true}/>
                    <label htmlFor={this.id} onClick={this.switch}/>
                </div>
                {this.renderDescription()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(Switch, {modules: ['FormGroup'], styles});
