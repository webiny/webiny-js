import React from 'react';
import { createComponent, i18n, isElementOfType } from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.List.Table.MultiActions
 */
class MultiActions extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Dropdown } = this.props;
        return (
            <Dropdown title={this.props.label}>
                <Dropdown.Header title={i18n('Actions')}/>
                {React.Children.map(this.props.children, child => {
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

MultiActions.defaultProps = {
    label: i18n('With selected...')
};

export default createComponent(MultiActions, { modules: ['Dropdown'] });