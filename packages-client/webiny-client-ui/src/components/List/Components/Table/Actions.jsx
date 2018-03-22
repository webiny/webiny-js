import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.List.Table.Actions
 */
class Actions extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.bindMethods('shouldHideItem');
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
}

Actions.defaultProps = {
    label: 'Actions',
    hide: false,
    renderer() {
        if (this.props.hide) {
            return null;
        }

        const {Dropdown} = this.props;

        return (
            <Dropdown title={this.props.label} type="balloon">
                <Dropdown.Header title={this.i18n('Actions')}/>
                {React.Children.map(this.props.children, child => {
                    if (this.shouldHideItem(child)) {
                        return null;
                    }

                    if (Webiny.isElementOfType(child, Dropdown.Divider) || Webiny.isElementOfType(child, Dropdown.Header)) {
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
};

export default Webiny.createComponent(Actions, {modules: ['Dropdown']});