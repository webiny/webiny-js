import React from "react";
import _ from "lodash";
import { createComponent, i18n } from "webiny-app";
import { FormComponent } from "webiny-app-ui";

class Date extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.element = null;
        this.input = null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (nextProps["disabledBy"]) {
            return true;
        }

        const omit = ["children", "key", "ref", "onChange"];
        const oldProps = _.omit(this.props, omit);
        const newProps = _.omit(nextProps, omit);

        return !_.isEqual(newProps, oldProps) || !_.isEqual(nextState, this.state);
    }

    componentDidMount() {
        this.props.attachToForm && this.props.attachToForm(this);
    }

    init() {
        let altFormat = this.props.inputFormat;
        if (!altFormat) {
            altFormat = i18n.getDateFormat();
        }

        this.element.flatpickr({
            altInput: true,
            altFormat,
            formatDate: date => {
                console.log("aaa", date);
            },
            onChange: (datesArray, newValue) => {
                if (newValue !== this.props.value) {
                    this.props.onChange(newValue, this.props.validate);
                }
            }
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const omitProps = [
            "attachToForm",
            "attachValidators",
            "detachFromForm",
            "validateInput",
            "form",
            "name",
            "onChange"
        ];
        const props = _.omit(this.props, omitProps);
        const { Input, Icon } = props;

        props.addonRight = <Icon icon="icon-calendar" />;
        props.onRef = element => {
            this.element = element;
            this.element && !this.initialized && this.init();
        };
        return <Input ref={ref => (this.input = ref)} {...props} />;
    }
}

Date.defaultProps = {
    inputFormat: null,
    modelFormat: "Y-m-d"
};

export default createComponent([Date, FormComponent], {
    modules: ["Icon", "Input", { flatpickr: "Vendor.FlatPickr" }],
    formComponent: true
});
