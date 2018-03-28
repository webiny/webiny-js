import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { createComponent } from "webiny-app";
import FormComponent from "./../Form/FormComponent";
import styles from "./styles.css";

class Switch extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialState
        };

        this.switch = this.switch.bind(this);
    }

    componentWillMount() {
        this.id = _.uniqueId("switch-");
        if (this.props.attachToForm) {
            this.props.attachToForm(this);
        }
    }

    switch() {
        if (this.props.isDisabled()) {
            return;
        }
        this.props.onChange(!this.dom.checked);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { FormGroup, styles } = this.props;
        let classes = classSet(styles.switch, styles.switchInline);
        if (this.props.disabled) {
            classes += " " + styles.disabled;
        }

        // The JSON.parse was added since sometimes value can come in as a string (eg. when value is coming from URL, as a query parameter).
        // With the JSON.parse, we ensure we get non-string, pure boolean value, and that the switch button is correctly rendered.
        const value = JSON.parse(this.props.value || null);

        return (
            <FormGroup>
                {this.props.renderLabel.call(this)}
                <div className="clearfix" />
                <div className={classes}>
                    <input
                        ref={ref => (this.dom = ref)}
                        id={this.id}
                        type="checkbox"
                        readOnly
                        checked={value === true}
                    />
                    <label htmlFor={this.id} onClick={this.switch} />
                </div>
                {this.props.renderDescription.call(this)}
            </FormGroup>
        );
    }
}

Switch.defaultProps = {
    style: {}
};

export default createComponent([Switch, FormComponent], {
    modules: ["FormGroup"],
    styles,
    formComponent: true
});
