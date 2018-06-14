import React, { Fragment } from "react";
import TogglePermissionButton from "./../components/TogglePermissionButton";
import _ from "lodash";
import { i18n, inject } from "webiny-client";
const t = i18n.namespace("Security.EntitiesList");

const entityOperationPath = (classId, permissionClass, operation) => {
    return `permissions.entities.${classId}.${permissionClass}.operations.${operation}`;
};

@inject({
    modules: ["List", "ListData", "Grid", "Input", "Loader"]
})
class EntitiesList extends React.Component {
    renderCrudTogglePermissionButtons({ permissionClass, $this, data }) {
        const { model } = this.props.form.state;
        return ["create", "read", "update", "delete"].map(operation => {
            const paths = {
                current: entityOperationPath(data.classId, permissionClass.key, operation),
                others: entityOperationPath(data.classId, "other", operation)
            };

            return (
                <TogglePermissionButton
                    key={`${permissionClass.key}_${operation}`}
                    label={operation.charAt(0).toUpperCase()}
                    value={_.get(model, paths.current)}
                    onClick={async () => {
                        this.props.form.setState(
                            state => {
                                if (_.get(state.model, paths.current)) {
                                    _.unset(state.model, paths.current);
                                } else {
                                    _.set(state.model, paths.current, true);
                                }
                                return state;
                            },
                            () => {
                                // Update will not happen automatically because
                                // of the parent Table component which prevents it.
                                $this.forceUpdate();
                            }
                        );
                    }}
                />
            );
        });
    }

    renderList() {
        const { Input, Grid, List, ListData, Loader } = this.props.modules;
        const Table = List.Table;

        return (
            <ListData
                withRouter
                entity="Entity"
                fields="classId name permissions"
                search={{ fields: ["name", "slug"] }}
            >
                {({ loading, ...listProps }) => (
                    <Fragment>
                        {loading && <Loader />}

                        <List {...listProps}>
                            <List.FormFilters>
                                {({ apply }) => (
                                    <Grid.Row>
                                        <Grid.Col all={12}>
                                            <Input
                                                name="search.query"
                                                placeholder={t`Search by name or slug`}
                                                onEnter={apply()}
                                            />
                                        </Grid.Col>
                                    </Grid.Row>
                                )}
                            </List.FormFilters>
                            <Table>
                                <Table.Row>
                                    <Table.Field name="name" label={t`Name`}>
                                        {({ data }) => (
                                            <span>
                                                <strong>{data.classId}</strong>
                                                <br />
                                                {data.name}
                                            </span>
                                        )}
                                    </Table.Field>

                                    {[
                                        { key: "owner", label: t`Owner` },
                                        { key: "group", label: t`Group` },
                                        { key: "other", label: t`Other` }
                                    ].map(permissionClass => {
                                        return (
                                            <Table.Field
                                                key={permissionClass.key}
                                                name={permissionClass.key}
                                                align={"center"}
                                                label={permissionClass.label}
                                            >
                                                {({ $this, data }) =>
                                                    this.renderCrudTogglePermissionButtons({
                                                        permissionClass,
                                                        $this,
                                                        data
                                                    })
                                                }
                                            </Table.Field>
                                        );
                                    })}
                                </Table.Row>
                            </Table>
                        </List>
                    </Fragment>
                )}
            </ListData>
        );
    }

    render() {
        const { ListData, Loader } = this.props.modules;
        return (
            <ListData
                withRouter
                entity="Entity"
                fields="classId name permissions"
                search={{ fields: ["name", "slug"] }}
            >
                {({ loading, ...listProps }) => (
                    <Fragment>
                        {loading && <Loader />}

                        {this.renderList(listProps)}
                    </Fragment>
                )}
            </ListData>
        );
    }
}

export default EntitiesList;
