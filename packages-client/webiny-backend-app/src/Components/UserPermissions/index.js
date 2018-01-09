import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Backend.UserPermissions
 */
class UserPermissions extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            permissions: []
        };
    }

    componentWillMount() {
        super.componentWillMount();
        new Webiny.Api.Endpoint(this.props.api).get('/', {_perPage: 1000, _sort: 'name'}).then(apiResponse => {
            this.setState({permissions: apiResponse.getData('list')});
        });
    }

    onChange(index, permission, enabled) {
        const value = this.props.value || [];
        if (enabled) {
            value.push(permission);
        } else {
            value.splice(index, 1);
        }
        this.props.onChange(value);
    }
}

UserPermissions.defaultProps = {
    api: '/entities/webiny/user-permissions',
    value: [],
    onChange: _.noop,
    renderer() {
        const {List, Switch, Link} = this.props;
        return (
            <List.Table data={this.state.permissions}>
                <List.Table.Row>
                    <List.Table.Field style={{width: 140}}>
                        {({data}) => {
                            const checkedIndex = _.findIndex(this.props.value, {id: data.id});
                            return (
                                <Switch value={checkedIndex > -1} onChange={enabled => this.onChange(checkedIndex, data, enabled)}/>
                            );
                        }}
                    </List.Table.Field>
                    <List.Table.Field label={this.i18n('Permission')}>
                        {({data}) => (
                            <span>
                                <Link route="UserPermissions.Edit" params={{id: data.id}}><strong>{data.name}</strong></Link>
                                <br/>{data.slug}
                            </span>
                        )}
                    </List.Table.Field>
                    <List.Table.Field label={this.i18n('Description')} name="description"/>
                </List.Table.Row>
            </List.Table>
        );
    }
};

export default Webiny.createComponent(UserPermissions, {modules: ['List', 'Switch', 'Link']});