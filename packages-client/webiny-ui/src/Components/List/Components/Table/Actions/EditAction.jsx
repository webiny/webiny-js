import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import RouteAction from './RouteAction';

class EditAction extends Webiny.Ui.Component {

}

EditAction.defaultProps = {
    label: 'Edit',
    icon: 'icon-pencil',
    renderer() {
        const props = _.pick(this.props, ['data', 'label', 'icon']);
        const {Link, Icon} = this.props;

        if (this.props.onClick) {
            const icon = props.icon ? <Icon icon={props.icon}/> : null;
            props.onClick = () => this.props.onClick({data: this.props.data});
            return (
                <Link {...props}>
                    {icon}
                    {props.label}
                </Link>
            );
        }

        if (this.props.route) {
            let route = this.props.route;
            if (_.isFunction(route)) {
                route = route(this.props.data);
            }
            props.route = route;
        }

        return (
            <RouteAction {...props}/>
        );
    }
};

export default Webiny.createComponent(EditAction, {modules: ['Link', 'Icon']});