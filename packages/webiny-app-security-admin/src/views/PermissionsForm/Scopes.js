import React from "react";
import css from "./Scopes.scss";
import _ from "lodash";
import QueryMutationFieldsList from "./Scopes/QueryMutationFieldsList";
import FieldsSelector from "./Scopes/FieldsSelector";
import { createComponent, i18n } from "webiny-app";

const t = i18n.namespace("Security.PermissionsForm.Scopes");

class Scopes extends React.Component {
    constructor() {
        super();
        this.state = {
            schema: mock.data.__schema,
            selectedQueryMutationField: null
        };
    }

    getType(name) {
        return _.find(this.state.schema.types, { name });
    }

    render() {
        const { Grid } = this.props.modules;

        return (
            <div className={css.scopes}>
                <Grid.Row>
                    <Grid.Col md={3} className={css.sidebar}>
                        <h3>{t`Queries & Mutations`}</h3>
                        <h4>{t`Choose query or mutation you wish to manage.`}</h4>
                        <QueryMutationFieldsList
                            fields={this.getType("Query").fields}
                            selected={this.state.selectedQueryMutationField}
                            onSelect={selectedQueryMutationField => {
                                this.setState({ selectedQueryMutationField });
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

                                setTimeout(() => {
                                    console.log(this.props.form.state.model);
                                }, 500);
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

const mock = {
    data: {
        __schema: {
            queryType: { name: "Query" },
            mutationType: { name: "Mutation" },
            subscriptionType: null,
            types: [
                {
                    kind: "OBJECT",
                    name: "Query",
                    description: null,
                    fields: [
                        {
                            name: "getSecurityUser",
                            description: "Get a single SecurityUser entity by ID.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityUser", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "listSecurityUsers",
                            description: "Get a list of SecurityUser entities.",
                            args: [
                                {
                                    name: "page",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Int", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "perPage",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Int", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "filter",
                                    description: null,
                                    type: { kind: "SCALAR", name: "JSON", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "sort",
                                    description: null,
                                    type: { kind: "SCALAR", name: "JSON", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "search",
                                    description: null,
                                    type: {
                                        kind: "INPUT_OBJECT",
                                        name: "SearchInput",
                                        ofType: null
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityUserList", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "getSecurityRole",
                            description: "Get a single SecurityRole entity by ID.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityRole", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "listSecurityRoles",
                            description: "Get a list of SecurityRole entities.",
                            args: [
                                {
                                    name: "page",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Int", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "perPage",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Int", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "filter",
                                    description: null,
                                    type: { kind: "SCALAR", name: "JSON", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "sort",
                                    description: null,
                                    type: { kind: "SCALAR", name: "JSON", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "search",
                                    description: null,
                                    type: {
                                        kind: "INPUT_OBJECT",
                                        name: "SearchInput",
                                        ofType: null
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityRoleList", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "getSecurityRoleGroup",
                            description: "Get a single SecurityRoleGroup entity by ID.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityRoleGroup", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "listSecurityRoleGroups",
                            description: "Get a list of SecurityRoleGroup entities.",
                            args: [
                                {
                                    name: "page",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Int", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "perPage",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Int", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "filter",
                                    description: null,
                                    type: { kind: "SCALAR", name: "JSON", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "sort",
                                    description: null,
                                    type: { kind: "SCALAR", name: "JSON", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "search",
                                    description: null,
                                    type: {
                                        kind: "INPUT_OBJECT",
                                        name: "SearchInput",
                                        ofType: null
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityRoleGroupList", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "getSecurityPermission",
                            description: "Get a single SecurityPermission entity by ID.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityPermission", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "listSecurityPermissions",
                            description: "Get a list of SecurityPermission entities.",
                            args: [
                                {
                                    name: "page",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Int", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "perPage",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Int", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "filter",
                                    description: null,
                                    type: { kind: "SCALAR", name: "JSON", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "sort",
                                    description: null,
                                    type: { kind: "SCALAR", name: "JSON", ofType: null },
                                    defaultValue: null
                                },
                                {
                                    name: "search",
                                    description: null,
                                    type: {
                                        kind: "INPUT_OBJECT",
                                        name: "SearchInput",
                                        ofType: null
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityPermissionList", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "loginSecurityUser",
                            description: null,
                            args: [
                                {
                                    name: "username",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                },
                                {
                                    name: "password",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                },
                                {
                                    name: "remember",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Boolean", ofType: null },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityUserLoginData", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "getIdentity",
                            description: null,
                            args: [],
                            type: { kind: "UNION", name: "IdentityType", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "sendInvoiceToUser",
                            description: "Send email with invoice in the attachment",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: { kind: "SCALAR", name: "String", ofType: null },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "SCALAR",
                    name: "String",
                    description:
                        "The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.",
                    fields: null,
                    inputFields: null,
                    interfaces: null,
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityUser",
                    description: null,
                    fields: [
                        {
                            name: "savedOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "createdOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updatedOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "id",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "roles",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityRole", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "roleGroups",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityRoleGroup", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "email",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "password",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "firstName",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "lastName",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "gravatar",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "JSON", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "enabled",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "Boolean", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityRole",
                    description: null,
                    fields: [
                        {
                            name: "savedOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "createdOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updatedOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "id",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "name",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "slug",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "description",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "permissions",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityPermission", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "roleGroups",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityRoleGroup", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityPermission",
                    description: null,
                    fields: [
                        {
                            name: "savedOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "createdOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updatedOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "id",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "name",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "slug",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "description",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "fields",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "roles",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityRole", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "SCALAR",
                    name: "JSON",
                    description:
                        "The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf).",
                    fields: null,
                    inputFields: null,
                    interfaces: null,
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityRoleGroup",
                    description: null,
                    fields: [
                        {
                            name: "savedOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "createdOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updatedOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "id",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "name",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "slug",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "description",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "roles",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityRole", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "SCALAR",
                    name: "Boolean",
                    description: "The `Boolean` scalar type represents `true` or `false`.",
                    fields: null,
                    inputFields: null,
                    interfaces: null,
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "SCALAR",
                    name: "Int",
                    description:
                        "The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. ",
                    fields: null,
                    inputFields: null,
                    interfaces: null,
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "INPUT_OBJECT",
                    name: "SearchInput",
                    description: null,
                    fields: null,
                    inputFields: [
                        {
                            name: "query",
                            description: "Search query term",
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            defaultValue: null
                        },
                        {
                            name: "fields",
                            description: "Fields to search in",
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            defaultValue: null
                        },
                        {
                            name: "operator",
                            description:
                                "If multiple fields are being searched, this operator will be applied to determine if the result applies.",
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            defaultValue: null
                        }
                    ],
                    interfaces: null,
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityUserList",
                    description: null,
                    fields: [
                        {
                            name: "list",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityUser", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "meta",
                            description: null,
                            args: [],
                            type: { kind: "OBJECT", name: "ListMeta", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "ListMeta",
                    description: null,
                    fields: [
                        {
                            name: "count",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "Int", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "totalCount",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "Int", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "totalPages",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "Int", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityRoleList",
                    description: null,
                    fields: [
                        {
                            name: "list",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityRole", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "meta",
                            description: null,
                            args: [],
                            type: { kind: "OBJECT", name: "ListMeta", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityRoleGroupList",
                    description: null,
                    fields: [
                        {
                            name: "list",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityRoleGroup", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "meta",
                            description: null,
                            args: [],
                            type: { kind: "OBJECT", name: "ListMeta", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityPermissionList",
                    description: null,
                    fields: [
                        {
                            name: "list",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: { kind: "OBJECT", name: "SecurityPermission", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "meta",
                            description: null,
                            args: [],
                            type: { kind: "OBJECT", name: "ListMeta", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "SecurityUserLoginData",
                    description: null,
                    fields: [
                        {
                            name: "token",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "identity",
                            description: null,
                            args: [],
                            type: { kind: "OBJECT", name: "SecurityUser", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "expiresOn",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "Int", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "UNION",
                    name: "IdentityType",
                    description: null,
                    fields: null,
                    inputFields: null,
                    interfaces: null,
                    enumValues: null,
                    possibleTypes: [{ kind: "OBJECT", name: "SecurityUser", ofType: null }]
                },
                {
                    kind: "OBJECT",
                    name: "Mutation",
                    description: null,
                    fields: [
                        {
                            name: "createSecurityUser",
                            description: "Create a single SecurityUser entity.",
                            args: [
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityUser", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updateSecurityUser",
                            description: "Update a single SecurityUser entity.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                },
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityUser", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "deleteSecurityUser",
                            description: "Delete a single SecurityUser entity.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "SCALAR", name: "Boolean", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "createSecurityRole",
                            description: "Create a single SecurityRole entity.",
                            args: [
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityRole", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updateSecurityRole",
                            description: "Update a single SecurityRole entity.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                },
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityRole", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "deleteSecurityRole",
                            description: "Delete a single SecurityRole entity.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "SCALAR", name: "Boolean", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "createSecurityRoleGroup",
                            description: "Create a single SecurityRoleGroup entity.",
                            args: [
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityRoleGroup", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updateSecurityRoleGroup",
                            description: "Update a single SecurityRoleGroup entity.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                },
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityRoleGroup", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "deleteSecurityRoleGroup",
                            description: "Delete a single SecurityRoleGroup entity.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "SCALAR", name: "Boolean", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "createSecurityPermission",
                            description: "Create a single SecurityPermission entity.",
                            args: [
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityPermission", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updateSecurityPermission",
                            description: "Update a single SecurityPermission entity.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                },
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "OBJECT", name: "SecurityPermission", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "deleteSecurityPermission",
                            description: "Delete a single SecurityPermission entity.",
                            args: [
                                {
                                    name: "id",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "String", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "SCALAR", name: "Boolean", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "updateIdentity",
                            description: null,
                            args: [
                                {
                                    name: "data",
                                    description: null,
                                    type: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "SCALAR", name: "JSON", ofType: null }
                                    },
                                    defaultValue: null
                                }
                            ],
                            type: { kind: "UNION", name: "IdentityType", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "__Schema",
                    description:
                        "A GraphQL Schema defines the capabilities of a GraphQL server. It exposes all available types and directives on the server, as well as the entry points for query, mutation, and subscription operations.",
                    fields: [
                        {
                            name: "types",
                            description: "A list of all types supported by this server.",
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: {
                                    kind: "LIST",
                                    name: null,
                                    ofType: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: { kind: "OBJECT", name: "__Type", ofType: null }
                                    }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "queryType",
                            description: "The type that query operations will be rooted at.",
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "OBJECT", name: "__Type", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "mutationType",
                            description:
                                "If this server supports mutation, the type that mutation operations will be rooted at.",
                            args: [],
                            type: { kind: "OBJECT", name: "__Type", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "subscriptionType",
                            description:
                                "If this server support subscription, the type that subscription operations will be rooted at.",
                            args: [],
                            type: { kind: "OBJECT", name: "__Type", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "directives",
                            description: "A list of all directives supported by this server.",
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: {
                                    kind: "LIST",
                                    name: null,
                                    ofType: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: {
                                            kind: "OBJECT",
                                            name: "__Directive",
                                            ofType: null
                                        }
                                    }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "__Type",
                    description:
                        "The fundamental unit of any GraphQL Schema is the type. There are many kinds of types in GraphQL as represented by the `__TypeKind` enum.\n\nDepending on the kind of a type, certain fields describe information about that type. Scalar types provide no information beyond a name and description, while Enum types provide their values. Object and Interface types provide the fields they describe. Abstract types, Union and Interface, provide the Object types possible at runtime. List and NonNull types compose other types.",
                    fields: [
                        {
                            name: "kind",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "ENUM", name: "__TypeKind", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "name",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "description",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "fields",
                            description: null,
                            args: [
                                {
                                    name: "includeDeprecated",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Boolean", ofType: null },
                                    defaultValue: "false"
                                }
                            ],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: {
                                    kind: "NON_NULL",
                                    name: null,
                                    ofType: { kind: "OBJECT", name: "__Field", ofType: null }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "interfaces",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: {
                                    kind: "NON_NULL",
                                    name: null,
                                    ofType: { kind: "OBJECT", name: "__Type", ofType: null }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "possibleTypes",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: {
                                    kind: "NON_NULL",
                                    name: null,
                                    ofType: { kind: "OBJECT", name: "__Type", ofType: null }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "enumValues",
                            description: null,
                            args: [
                                {
                                    name: "includeDeprecated",
                                    description: null,
                                    type: { kind: "SCALAR", name: "Boolean", ofType: null },
                                    defaultValue: "false"
                                }
                            ],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: {
                                    kind: "NON_NULL",
                                    name: null,
                                    ofType: { kind: "OBJECT", name: "__EnumValue", ofType: null }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "inputFields",
                            description: null,
                            args: [],
                            type: {
                                kind: "LIST",
                                name: null,
                                ofType: {
                                    kind: "NON_NULL",
                                    name: null,
                                    ofType: { kind: "OBJECT", name: "__InputValue", ofType: null }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "ofType",
                            description: null,
                            args: [],
                            type: { kind: "OBJECT", name: "__Type", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "ENUM",
                    name: "__TypeKind",
                    description: "An enum describing what kind of type a given `__Type` is.",
                    fields: null,
                    inputFields: null,
                    interfaces: null,
                    enumValues: [
                        {
                            name: "SCALAR",
                            description: "Indicates this type is a scalar.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "OBJECT",
                            description:
                                "Indicates this type is an object. `fields` and `interfaces` are valid fields.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "INTERFACE",
                            description:
                                "Indicates this type is an interface. `fields` and `possibleTypes` are valid fields.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "UNION",
                            description:
                                "Indicates this type is a union. `possibleTypes` is a valid field.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "ENUM",
                            description:
                                "Indicates this type is an enum. `enumValues` is a valid field.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "INPUT_OBJECT",
                            description:
                                "Indicates this type is an input object. `inputFields` is a valid field.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "LIST",
                            description:
                                "Indicates this type is a list. `ofType` is a valid field.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "NON_NULL",
                            description:
                                "Indicates this type is a non-null. `ofType` is a valid field.",
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "__Field",
                    description:
                        "Object and Interface types are described by a list of Fields, each of which has a name, potentially a list of arguments, and a return type.",
                    fields: [
                        {
                            name: "name",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "description",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "args",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: {
                                    kind: "LIST",
                                    name: null,
                                    ofType: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: {
                                            kind: "OBJECT",
                                            name: "__InputValue",
                                            ofType: null
                                        }
                                    }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "type",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "OBJECT", name: "__Type", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "isDeprecated",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "Boolean", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "deprecationReason",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "__InputValue",
                    description:
                        "Arguments provided to Fields or Directives and the input fields of an InputObject are represented as Input Values which describe their type and optionally a default value.",
                    fields: [
                        {
                            name: "name",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "description",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "type",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "OBJECT", name: "__Type", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "defaultValue",
                            description:
                                "A GraphQL-formatted string representing the default value for this input value.",
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "__EnumValue",
                    description:
                        "One possible value for a given Enum. Enum values are unique values, not a placeholder for a string or numeric value. However an Enum value is returned in a JSON response as a string.",
                    fields: [
                        {
                            name: "name",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "description",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "isDeprecated",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "Boolean", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "deprecationReason",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "OBJECT",
                    name: "__Directive",
                    description:
                        "A Directive provides a way to describe alternate runtime execution and type validation behavior in a GraphQL document.\n\nIn some cases, you need to provide options to alter GraphQL's execution behavior in ways field arguments will not suffice, such as conditionally including or skipping a field. Directives provide this by describing additional information to the executor.",
                    fields: [
                        {
                            name: "name",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "String", ofType: null }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "description",
                            description: null,
                            args: [],
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "locations",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: {
                                    kind: "LIST",
                                    name: null,
                                    ofType: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: {
                                            kind: "ENUM",
                                            name: "__DirectiveLocation",
                                            ofType: null
                                        }
                                    }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "args",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: {
                                    kind: "LIST",
                                    name: null,
                                    ofType: {
                                        kind: "NON_NULL",
                                        name: null,
                                        ofType: {
                                            kind: "OBJECT",
                                            name: "__InputValue",
                                            ofType: null
                                        }
                                    }
                                }
                            },
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "onOperation",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "Boolean", ofType: null }
                            },
                            isDeprecated: true,
                            deprecationReason: "Use `locations`."
                        },
                        {
                            name: "onFragment",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "Boolean", ofType: null }
                            },
                            isDeprecated: true,
                            deprecationReason: "Use `locations`."
                        },
                        {
                            name: "onField",
                            description: null,
                            args: [],
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "Boolean", ofType: null }
                            },
                            isDeprecated: true,
                            deprecationReason: "Use `locations`."
                        }
                    ],
                    inputFields: null,
                    interfaces: [],
                    enumValues: null,
                    possibleTypes: null
                },
                {
                    kind: "ENUM",
                    name: "__DirectiveLocation",
                    description:
                        "A Directive can be adjacent to many parts of the GraphQL language, a __DirectiveLocation describes one such possible adjacencies.",
                    fields: null,
                    inputFields: null,
                    interfaces: null,
                    enumValues: [
                        {
                            name: "QUERY",
                            description: "Location adjacent to a query operation.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "MUTATION",
                            description: "Location adjacent to a mutation operation.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "SUBSCRIPTION",
                            description: "Location adjacent to a subscription operation.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "FIELD",
                            description: "Location adjacent to a field.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "FRAGMENT_DEFINITION",
                            description: "Location adjacent to a fragment definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "FRAGMENT_SPREAD",
                            description: "Location adjacent to a fragment spread.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "INLINE_FRAGMENT",
                            description: "Location adjacent to an inline fragment.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "SCHEMA",
                            description: "Location adjacent to a schema definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "SCALAR",
                            description: "Location adjacent to a scalar definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "OBJECT",
                            description: "Location adjacent to an object type definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "FIELD_DEFINITION",
                            description: "Location adjacent to a field definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "ARGUMENT_DEFINITION",
                            description: "Location adjacent to an argument definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "INTERFACE",
                            description: "Location adjacent to an interface definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "UNION",
                            description: "Location adjacent to a union definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "ENUM",
                            description: "Location adjacent to an enum definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "ENUM_VALUE",
                            description: "Location adjacent to an enum value definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "INPUT_OBJECT",
                            description: "Location adjacent to an input object type definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        },
                        {
                            name: "INPUT_FIELD_DEFINITION",
                            description: "Location adjacent to an input object field definition.",
                            isDeprecated: false,
                            deprecationReason: null
                        }
                    ],
                    possibleTypes: null
                }
            ],
            directives: [
                {
                    name: "include",
                    description:
                        "Directs the executor to include this field or fragment only when the `if` argument is true.",
                    locations: ["FIELD", "FRAGMENT_SPREAD", "INLINE_FRAGMENT"],
                    args: [
                        {
                            name: "if",
                            description: "Included when true.",
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "Boolean", ofType: null }
                            },
                            defaultValue: null
                        }
                    ]
                },
                {
                    name: "skip",
                    description:
                        "Directs the executor to skip this field or fragment when the `if` argument is true.",
                    locations: ["FIELD", "FRAGMENT_SPREAD", "INLINE_FRAGMENT"],
                    args: [
                        {
                            name: "if",
                            description: "Skipped when true.",
                            type: {
                                kind: "NON_NULL",
                                name: null,
                                ofType: { kind: "SCALAR", name: "Boolean", ofType: null }
                            },
                            defaultValue: null
                        }
                    ]
                },
                {
                    name: "deprecated",
                    description: "Marks an element of a GraphQL schema as no longer supported.",
                    locations: ["FIELD_DEFINITION", "ENUM_VALUE"],
                    args: [
                        {
                            name: "reason",
                            description:
                                "Explains why this element was deprecated, usually also including a suggestion for how to access supported similar data. Formatted in [Markdown](https://daringfireball.net/projects/markdown/).",
                            type: { kind: "SCALAR", name: "String", ofType: null },
                            defaultValue: '"No longer supported"'
                        }
                    ]
                }
            ]
        }
    }
};
