import React, { Fragment } from "react";
import TogglePermissionButton from "./TogglePermissionButton";
import _ from "lodash";
// import ExportEntityModal from "./Modal/ExportModal";
// import ImportEntityModal from "./Modal/ImportModal";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.EntitiesList");

class EntitiesList extends React.Component {
    renderList(listProps) {
        const { Input, Grid, List } = this.props.modules;
        const Table = List.Table;

        return (
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
                                    <strong>{data.name}</strong>
                                    <br />
                                    {data.classId}
                                </span>
                            )}
                        </Table.Field>

                        <Table.Field name="operations" align={"center"} label={t`Operations`}>
                            {({ data, $this }) =>
                                ["create", "read", "update", "delete"].map(operation => {
                                    const path = `permissions.entities.${
                                        data.classId
                                    }.operations.${operation}`;
                                    return (
                                        <TogglePermissionButton
                                            key={operation}
                                            label={operation.charAt(0).toUpperCase()}
                                            value={_.get(this.props.model, path)}
                                            onClick={() => {
                                                this.props.form.setState(
                                                    state => {
                                                        if (_.get(state.model, path)) {
                                                            _.unset(state.model, path);
                                                        } else {
                                                            _.set(state.model, path, true);
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
                                })
                            }
                        </Table.Field>
                    </Table.Row>
                </Table>
                <List.Pagination />
            </List>
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

export default createComponent(EntitiesList, {
    modules: ["List", "ListData", "Grid", "Input", "Loader"]
});
