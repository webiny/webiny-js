import React from "react";
import _ from "lodash";
import { createComponent, i18n } from "webiny-client";
import icons from "./icons";

const t = i18n.namespace("Webiny.Ui.IconPicker");

class IconPicker extends React.Component {
    constructor(props) {
        super(props);

        ["renderOption", "renderSelected"].map(m => (this[m] = this[m].bind(this)));
    }

    renderOption({ option, ...params }) {
        if (this.props.renderOption) {
            return this.props.renderOption({ option, ...params });
        }

        const { Icon } = this.props.modules;
        return (
            <div>
                <Icon icon={[option.data.prefix, option.data.icon]} /> {option.data.icon}
            </div>
        );
    }

    renderSelected({ option, ...params }) {
        if (this.props.renderSelected) {
            return this.props.renderSelected({ option, ...params });
        }

        const { Icon } = this.props.modules;
        return (
            <div>
                <Icon icon={[option.data.prefix, option.data.icon]} /> {option.data.icon}
            </div>
        );
    }

    shouldComponentUpdate(props) {
        return !_.isEqual(props.value, this.props.value);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const {
            modules: { Select },
            ...props
        } = _.omit(this.props, ["render"]);
        props.renderOption = this.renderOption;
        props.renderSelected = this.renderSelected;

        return <Select {...props} options={icons} />;
    }
}

IconPicker.defaultProps = {
    minimumInputLength: 2,
    placeholder: t`Select an icon`,
    tooltip: t`Visit https://fontawesome.com/ for a full list`,
    renderOption: null,
    renderSelected: null,
    useDataAsValue: true
};

export default createComponent(IconPicker, { modules: ["Select", "Icon"] });
