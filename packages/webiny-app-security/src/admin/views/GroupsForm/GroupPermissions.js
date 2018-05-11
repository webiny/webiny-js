import React from "react";
import css from "./GroupPermissions.scss";
import _ from "lodash";
import EntitiesList from "./Access/EntitiesList";
import TogglePermissionButton from "./../components/TogglePermissionButton";
import { createComponent, i18n } from "webiny-app";
import { app } from "webiny-app";
import gql from "graphql-tag";

const t = i18n.namespace("Security.GroupsForm.GroupPermissions");

class GroupPermissions extends React.Component {
    constructor() {
        super();
        this.state = {
            entities: {
                list: [],
                current: null
            }
        };
    }

    componentWillMount() {
        const query = gql`
            {
                listEntities {
                    list {
                        attributes {
                            name
                        }
                        id
                        name
                    }
                }
            }
        `;

        app.graphql.query({ query }).then(({ data }) => {
            this.setState(state => {
                state.entities.list = data.listEntities.list;
                state.entities.current = state.entities.list[0];
                return state;
            });
        });
    }

    renderEntitiesList() {}

    renderPermissions() {
        const { Grid } = this.props.modules;

        const entity = this.state.entities.current;

        return (
            <Grid.Row>
                <Grid.Col md={12}>
                    <h3>{t`Operations`}</h3>
                    <h4>{t`Modify access to operations (create, read, update and delete).`}</h4>

                    {["create", "read", "update", "delete"].map(operation => {
                        const path = `permissions.entities.${entity.id}.operations.${operation}`;

                        return (
                            <TogglePermissionButton
                                key={_.uniqueId()}
                                label={operation.charAt(0).toUpperCase()}
                                value={_.get(this.props.model, path)}
                                onClick={() => {
                                    this.props.form.setState(state => {
                                        if (_.get(state.model, path)) {
                                            _.unset(state.model, path);
                                        } else {
                                            _.set(state.model, path, true);
                                        }

                                        return state;
                                    });
                                }}
                            />
                        );
                    })}

                    <br />
                    <br />
                    <br />

                    <h3>{t`Attributes`}</h3>
                    <h4>{t`Modify access to attributes.`}</h4>

                    <table className={"Webiny_Ui_Table_table text-center"}>
                        <thead>
                            <tr>
                                <th className={"text-left"}>{t`Attribute`}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entity.attributes.map(attribute => {
                                return (
                                    <tr key={attribute.name}>
                                        <td className={"text-left"}>{attribute.name}</td>
                                        <td>
                                            {["read", "write"].map(operation => {
                                                const path = `permissions.entities.${
                                                    entity.id
                                                }.attributes.${attribute.name}.${operation}`;

                                                return (
                                                    <TogglePermissionButton
                                                        key={operation}
                                                        value={_.get(this.props.model, path)}
                                                        label={operation.charAt(0).toUpperCase()}
                                                        onClick={() => {
                                                            this.props.form.setState(state => {
                                                                if (_.get(this.props.model, path)) {
                                                                    _.unset(state.model, path);
                                                                } else {
                                                                    _.set(state.model, path, true);
                                                                }

                                                                return state;
                                                            });
                                                        }}
                                                    />
                                                );
                                            })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Grid.Col>
            </Grid.Row>
        );
    }

    render() {
        const { Grid } = this.props.modules;

        return (
            <div className={css.groupPermissions}>
                <Grid.Row>
                    <Grid.Col md={3} className={css.sidebar}>
                        <h3>{t`Entities`}</h3>
                        <h4>{t`Select an entity from the list.`}</h4>
                        <EntitiesList
                            model={this.props.model}
                            entities={this.state.entities}
                            onSelect={entity => {
                                console.log(entity);
                                this.setState(state => {
                                    state.entities.current = entity;
                                    return state;
                                });
                            }}
                        />
                    </Grid.Col>
                    <Grid.Col md={9}>
                        {this.state.entities.current && this.renderPermissions()}
                    </Grid.Col>
                </Grid.Row>
            </div>
        );
    }
}

GroupPermissions.defaultProps = {
    model: null,
    form: null
};

export default createComponent(GroupPermissions, { modules: ["Grid", "List"] });
