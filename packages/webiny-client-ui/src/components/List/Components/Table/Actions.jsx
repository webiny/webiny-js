import React from "react";
import _ from "lodash";
import { Component, isElementOfType, i18n } from "webiny-client";

const t = i18n.namespace("Ui.List.Table.Actions");

@Component({ modules: ["Dropdown"] })
class Actions extends React.Component {
    constructor(props) {
        super(props);

        this.shouldHideItem = this.shouldHideItem.bind(this);
    }

    shouldComponentUpdate(props) {
        const check = ["data", "hide"];

        return !_.isEqual(_.pick(this.props, check), _.pick(props, check));
    }

    shouldHideItem(item) {
        let hide = item.props.hide || false;
        if (hide) {
            hide = _.isFunction(hide) ? hide(this.props.data) : hide;
        }

        let show = item.props.show || true;
        if (show) {
            show = _.isFunction(show) ? show(this.props.data) : show;
        }

        return hide || !show;
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (this.props.hide) {
            return null;
        }

        const { Dropdown } = this.props.modules;

        return (
            <Dropdown title={this.props.label} type="balloon">
                <Dropdown.Header title={t`Actions`} />
                {React.Children.map(this.props.children, child => {
                    if (this.shouldHideItem(child)) {
                        return null;
                    }

                    if (
                        isElementOfType(child, Dropdown.Divider) ||
                        isElementOfType(child, Dropdown.Header)
                    ) {
                        return child;
                    }

                    return (
                        <li role="presentation">
                            {React.cloneElement(child, {
                                data: this.props.data,
                                actions: this.props.actions
                            })}
                        </li>
                    );
                })}
            </Dropdown>
        );
    }
}

Actions.defaultProps = {
    label: "Actions",
    hide: false
};

export default Actions;
