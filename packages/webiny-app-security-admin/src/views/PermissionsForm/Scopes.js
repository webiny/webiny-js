import React from "react";
import css from "./Scopes.scss";
import _ from "lodash";
import QueryMutationFieldsList from "./Scopes/QueryMutationFieldsList";
import FieldsSelector from "./Scopes/FieldsSelector";
import { createComponent, i18n } from "webiny-app";
import fetch from "isomorphic-fetch";
import query from "./Scopes/introspectionQuery";

const t = i18n.namespace("Security.PermissionsForm.Scopes");

class Scopes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            schema: null,
            selectedQueryMutationField: null
        };

        fetch("http://localhost:9000/graphql", {
            method: "post",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        }).then(async response => {
            const data = await response.json();
            this.setState({ schema: data.data.__schema });
        });
    }

    getQueriesAndMutations() {
        const queries = _.find(this.state.schema.types, { name: "Query" }).fields;
        const mutations = _.find(this.state.schema.types, { name: "Mutation" }).fields;
        return queries.concat(mutations);
    }

    render() {
        if (!this.state.schema) {
            return null;
        }

        const { Grid } = this.props.modules;

        return (
            <div className={css.scopes}>
                <Grid.Row>
                    <Grid.Col md={3} className={css.sidebar}>
                        <h3>{t`Queries & Mutations`}</h3>
                        <h4>{t`Choose query or mutation you wish to manage.`}</h4>
                        <QueryMutationFieldsList
                            model={this.props.model}
                            schema={this.state.schema}
                            queriesAndMutations={this.getQueriesAndMutations()}
                            selected={this.state.selectedQueryMutationField}
                            onSelect={selectedQueryMutationField => {
                                this.setState({ selectedQueryMutationField });
                            }}
                            onToggle={selectedQueryMutationField => {
                                this.props.form.setState(state => {
                                    if (
                                        _.get(
                                            state.model,
                                            "scope." + selectedQueryMutationField.name
                                        )
                                    ) {
                                        _.unset(
                                            state.model,
                                            "scope." + selectedQueryMutationField.name
                                        );
                                    } else {
                                        _.set(
                                            state.model,
                                            "scope." + selectedQueryMutationField.name,
                                            true
                                        );
                                    }
                                    return state;
                                });
                            }}
                        />
                    </Grid.Col>
                    <Grid.Col md={9} className={css.scope}>
                        <h3>{t`Scope`}</h3>
                        <h4
                        >{t`Choose fields that will be exposed. Use SHIFT + click to select many fields at once.`}</h4>

                        <FieldsSelector
                            model={this.props.model}
                            schema={this.state.schema}
                            selectedQueryMutationField={this.state.selectedQueryMutationField}
                            onToggle={path => {
                                this.props.form.setState(state => {
                                    if (_.get(state.model, "scope." + path)) {
                                        _.unset(state.model, "scope." + path);
                                    } else {
                                        _.set(state.model, "scope." + path, true);
                                    }
                                    return state;
                                });
                            }}
                            onMultiToggle={paths => {
                                this.props.form.setState(state => {
                                    let enable = null;
                                    paths.forEach(path => {
                                        if (enable === null) {
                                            enable = _.get(state.model, "scope." + path);
                                            return true;
                                        }

                                        if (enable) {
                                            _.set(state.model, "scope." + path, true);
                                        } else {
                                            _.unset(state.model, "scope." + path);
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

Scopes.defaultProps = {};

export default createComponent(Scopes, { modules: ["Grid"] });
