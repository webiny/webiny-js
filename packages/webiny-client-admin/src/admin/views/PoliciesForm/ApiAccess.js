import React from "react";
import css from "./ApiAccess.scss";
import _ from "lodash";
import QueryMutationFieldsList from "./ApiAccess/QueryMutationFieldsList";
import FieldsSelector from "./ApiAccess/FieldsSelector";
import { inject, i18n } from "webiny-client";
import fetch from "isomorphic-fetch";
import query from "./ApiAccess/introspectionQuery";

const t = i18n.namespace("Security.PermissionsForm.Scopes");

@inject({ modules: ["Grid"] })
class ApiAccess extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            schema: null,
            queriesAndMutations: {
                list: null,
                selected: null
            }
        };

        fetch("http://localhost:9000/graphql", {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        }).then(async response => {
            const data = await response.json();
            const schema = data.data.__schema;
            let filteredQueriesAndMutations = [];
            filteredQueriesAndMutations = filteredQueriesAndMutations.concat(
                _.find(schema.types, { name: "Query" }).fields
            );
            filteredQueriesAndMutations = filteredQueriesAndMutations.concat(
                _.find(schema.types, { name: "Mutation" }).fields
            );

            this.setState({
                schema,
                queriesAndMutations: {
                    list: filteredQueriesAndMutations,
                    selected: filteredQueriesAndMutations[0]
                }
            });
        });
    }

    render() {
        if (!this.state.schema) {
            return null;
        }

        const { Grid } = this.props.modules;

        return (
            <div className={css.scopes}>
                <Grid.Row>
                    <Grid.Col md={4} className={css.sidebar}>
                        <h3>{t`Queries & Mutations`}</h3>
                        <h4>{t`Choose query or mutation you wish to manage.`}</h4>
                        <QueryMutationFieldsList
                            model={this.props.model}
                            schema={this.state.schema}
                            queriesAndMutations={this.state.queriesAndMutations.list}
                            selected={this.state.queriesAndMutations.selected}
                            onSelect={selectedQueryMutationField => {
                                this.setState(state => {
                                    state.queriesAndMutations.selected = selectedQueryMutationField;
                                    return state;
                                });
                            }}
                            onToggle={selectedQueryMutationField => {
                                this.props.form.setState(state => {
                                    if (
                                        _.get(
                                            state.model,
                                            "permissions.api." + selectedQueryMutationField.name
                                        )
                                    ) {
                                        _.unset(
                                            state.model,
                                            "permissions.api." + selectedQueryMutationField.name
                                        );
                                    } else {
                                        _.set(
                                            state.model,
                                            "permissions.api." + selectedQueryMutationField.name,
                                            true
                                        );
                                    }
                                    return state;
                                });
                            }}
                        />
                    </Grid.Col>
                    <Grid.Col md={8} className={css.scope}>
                        <h3>{t`Scope`}</h3>
                        <h4
                        >{t`Choose fields that will be exposed. Use SHIFT + click to select many fields at once.`}</h4>

                        <FieldsSelector
                            model={this.props.model}
                            schema={this.state.schema}
                            selectedQueryMutationField={this.state.queriesAndMutations.selected}
                            onToggle={path => {
                                this.props.form.setState(state => {
                                    if (_.get(state.model, `permissions.api.${path}`)) {
                                        _.unset(state.model, `permissions.api.${path}`);
                                    } else {
                                        _.set(state.model, `permissions.api.${path}`, true);
                                    }
                                    return state;
                                });
                            }}
                            onMultiToggle={paths => {
                                this.props.form.setState(state => {
                                    let enable = null;
                                    paths.forEach(path => {
                                        if (enable === null) {
                                            enable = _.get(state.model, `permissions.api.${path}`);
                                            return true;
                                        }

                                        if (enable) {
                                            _.set(state.model, `permissions.api.${path}`, true);
                                        } else {
                                            _.unset(state.model, `permissions.api.${path}`);
                                        }
                                    });
                                    return state;
                                });
                            }}
                        />
                    </Grid.Col>
                </Grid.Row>
            </div>
        );
    }
}

ApiAccess.defaultProps = {
    model: null,
    form: null
};

export default ApiAccess;
