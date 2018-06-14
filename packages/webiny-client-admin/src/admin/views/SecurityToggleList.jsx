import React from "react";
import _ from "lodash";

import { i18n, inject } from "webiny-client";
const t = i18n.namespace("Security.Permissions");

@inject({
    modules: ["List", "Switch", "Link"]
})
class PermissionsSettings extends React.Component {
    render() {
        const { List, Switch, Link } = this.props.modules;

        return (
            <List.Table data={this.props.options} key={this.props.value}>
                <List.Table.Row>
                    <List.Table.Field style={{ width: 140 }}>
                        {({ data }) => {
                            return (
                                <Switch
                                    value={_.find(this.props.value, { id: data.id }) !== undefined}
                                    onChange={() => this.props.onChange(data)}
                                />
                            );
                        }}
                    </List.Table.Field>
                    <List.Table.Field label={t`Permission`}>
                        {({ data }) => (
                            <span>
                                <Link route="Permissions.Edit" params={{ id: data.id }}>
                                    <strong>{data.name}</strong>
                                </Link>
                                <br />
                                {data.slug}
                            </span>
                        )}
                    </List.Table.Field>
                    <List.Table.Field label={t`Description`} name="description" />
                </List.Table.Row>
            </List.Table>
        );
    }
}

PermissionsSettings.defaultProps = {
    onChange: _.noop,
    value: [],
    options: []
};

export default PermissionsSettings;
