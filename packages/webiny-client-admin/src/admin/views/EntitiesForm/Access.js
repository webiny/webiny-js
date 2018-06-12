import React, { Fragment } from "react";
import css from "./Access.scss";
import TogglePermissionButton from "./../components/TogglePermissionButton";

import { createComponent, i18n } from "webiny-client";
import { app } from "webiny-client";
import gql from "graphql-tag";
import _ from "lodash";

const t = i18n.namespace("Security.PermissionsForm.Access");

class Access extends React.Component {
    constructor() {
        super();
        this.state = {
            classesGroups: {
                groups: [],
                classes: [
                    { id: "owner", name: t`Owner` },
                    {
                        id: "group",
                        name: t`Group`
                    },
                    { id: "other", name: t`Other` }
                ]
            }
        };
    }

    toggleOperation(operation, permissionsClass) {
        const mutation = gql`
            mutation {
                toggleEntityOperationPermission(
                    id: "${app.router.getParams("id")}"
                    class: "${permissionsClass.id}"
                    operation: "${operation}"
                ) {
                   entity { id attributes } permissions { owner group other }
                }
            }
        `;

        app.graphql.mutate({ mutation }).then(({ data }) => {
            this.props.form.setState({ model: data.toggleEntityOperationPermission });
        });
    }

    toggleAttribute(attribute, operation, permissionsClass) {
        const mutation = gql`
            mutation {
                toggleEntityAttributePermission(
                    id: "${app.router.getParams("id")}"
                    class: "${permissionsClass.id}"
                    attribute: "${attribute}"
                    operation: "${operation}"
                ) {
                   entity { id attributes } permissions { owner group other }
                }
            }
        `;

        app.graphql.mutate({ mutation }).then(({ data }) => {
            this.props.form.setState({ model: data.toggleEntityAttributePermission });
        });
    }

    render() {
        const { Grid, List } = this.props.modules;

        const Table = List.Table;

        return (
            <div className={css.access}>
                <Grid.Row>
                    <Grid.Col md={12}>
                        <h3>{t`Operations`}</h3>
                        <h4>{t`Modify access to operations (create, read, update and delete).`}</h4>

                        {/* Leave dummy data with _.uniqueId, without it, toggle buttons will not be updated */}
                        <Table data={[{ id: _.uniqueId() }]}>
                            <Table.Row>
                                <Table.Field name="operations">
                                    {() => <Fragment>{t`Operations`}</Fragment>}
                                </Table.Field>
                                {this.state.classesGroups.classes.map(permissionsClass => (
                                    <Table.Field
                                        key={_.uniqueId()}
                                        align="center"
                                        name={permissionsClass.id}
                                        label={permissionsClass.name}
                                    >
                                        {() => {
                                            return ["create", "read", "update", "delete"].map(
                                                operation => {
                                                    return (
                                                        <TogglePermissionButton
                                                            key={_.uniqueId()}
                                                            label={operation
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                            value={_.get(
                                                                this.props.model,
                                                                `permissions.${
                                                                    permissionsClass.id
                                                                }.operations.${operation}`
                                                            )}
                                                            onClick={() => {
                                                                this.toggleOperation(
                                                                    operation,
                                                                    permissionsClass
                                                                );
                                                            }}
                                                        />
                                                    );
                                                }
                                            );
                                        }}
                                    </Table.Field>
                                ))}
                            </Table.Row>
                        </Table>

                        <br />
                        <h3>{t`Attributes`}</h3>
                        <h4>{t`Modify access to attributes.`}</h4>

                        <table className={"Webiny_Ui_Table_table text-center"}>
                            <thead>
                                <tr>
                                    <th className={"text-left"}>{t`Attribute`}</th>
                                    <th className={"text-center"}>{t`Owner`}</th>
                                    <th className={"text-center"}>{t`Group`}</th>
                                    <th className={"text-center"}>{t`Other`}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.props.form.state.model.entity.attributes.map(attribute => {
                                    return (
                                        <tr key={attribute.name}>
                                            <td className={"text-left"}>{attribute.name}</td>
                                            {this.state.classesGroups.classes.map(
                                                permissionsClass => (
                                                    <td key={permissionsClass.id}>
                                                        {["read", "write"].map(operation => (
                                                            <TogglePermissionButton
                                                                key={operation}
                                                                value={_.get(
                                                                    this.props.model,
                                                                    `permissions.${
                                                                        permissionsClass.id
                                                                    }.attributes.${
                                                                        attribute.name
                                                                    }.${operation}`
                                                                )}
                                                                label={operation
                                                                    .charAt(0)
                                                                    .toUpperCase()}
                                                                onClick={() => {
                                                                    this.toggleAttribute(
                                                                        attribute.name,
                                                                        operation,
                                                                        permissionsClass
                                                                    );
                                                                }}
                                                            />
                                                        ))}
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </Grid.Col>
                </Grid.Row>
            </div>
        );
    }
}

Access.defaultProps = {
    model: null,
    form: null
};

export default createComponent(Access, { modules: ["Grid", "List"] });
