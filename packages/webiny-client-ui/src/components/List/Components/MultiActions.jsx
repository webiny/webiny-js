import React from 'react';
import { inject, i18n, isElementOfType } from 'webiny-client';

const t = i18n.namespace("Webiny.Ui.List.Table.MultiActions");
@inject({ modules: ['Dropdown'], listMultiActionsComponent: true })
class MultiActions extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Dropdown } = this.props.modules;
        return (
            <Dropdown title={this.props.label}>
                <Dropdown.Header title={t`Actions`}/>
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
    label: t`With selected...`
};

export default MultiActions;