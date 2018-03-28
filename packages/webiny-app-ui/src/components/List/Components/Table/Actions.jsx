import React from 'react';
import _ from 'lodash';
import { createComponent, isElementOfType, i18n } from 'webiny-app';

const t = i18n.namespace("Ui.List.Table.Actions");
class Actions extends React.Component {

    constructor(props) {
        super(props);

        this.shouldHideItem = this.shouldHideItem.bind(this);
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

        const { Dropdown } = this.props;

        return (
            <Dropdown title={this.props.label} type="balloon">
                <Dropdown.Header title={t`Actions`}/>
                {React.Children.map(this.props.children, child => {
                    if (this.shouldHideItem(child)) {
                        return null;
                    }

                    if (isElementOfType(child, Dropdown.Divider) || isElementOfType(child, Dropdown.Header)) {
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
    label: 'Actions',
    hide: false
};

export default createComponent(Actions, { modules: ['Dropdown'] });