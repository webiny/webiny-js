import React from "react";
import css from "./Access.scss";
import _ from "lodash";
import ClassesLists from "./Access/ClassesLists";
import OperationsPermissions from "./Access/OperationsPermissions";
import AttributesPermissions from "./Access/AttributesPermissions";

import { createComponent, i18n } from "webiny-app";
import { app } from "webiny-app";
import gql from "graphql-tag";

const t = i18n.namespace("Security.PermissionsForm.Access");

class Access extends React.Component {
    constructor() {
        super();

        this.state = {
            holdingShift: false,
            classesGroups: {
                groups: [],
                classes: [
                    { id: "owner", name: t`Owner`, description: t`Permissions of owners.` },
                    {
                        id: "group",
                        name: t`Group`,
                        description: t`Users that are in the same group.`
                    },
                    { id: "other", name: t`Other`, description: t`Other users.` }
                ],
                current: { type: "class", modelPath: "permissions.owner", id: "owner" }
            }
        };

        this.setShiftDown = event => {
            if (event.keyCode === 16 || event.charCode === 16) {
                this.setState({ holdingShift: true });
            }
        };

        this.setShiftUp = event => {
            if (event.keyCode === 16 || event.charCode === 16) {
                this.setState({ holdingShift: false });
            }
        };

        // TODO: unmount listeners
        window.addEventListener
            ? document.addEventListener("keydown", this.setShiftDown)
            : document.attachEvent("keydown", this.setShiftDown);
        window.addEventListener
            ? document.addEventListener("keyup", this.setShiftUp)
            : document.attachEvent("keyup", this.setShiftUp);
    }

    componentWillMount() {
        const query = gql`
            {
                listSecurityGroups {
                    list {
                        id
                        name
                        description
                    }
                }
            }
        `;

        app.graphql.query({ query }).then(({ data }) => {
            this.setState(state => {
                state.classesGroups.groups = data.listSecurityGroups.list;
                return state;
            });
        });
    }

    render() {
        const { Grid } = this.props.modules;

        return (
            <div className={css.access}>
                <Grid.Row>
                    <Grid.Col md={3} className={css.sidebar}>
                        <h3>{t`Class`}</h3>
                        <h4>{t`Choose class for which you wish to modify permissions.`}</h4>
                        <ClassesLists
                            model={this.props.model}
                            classesGroups={this.state.classesGroups}
                            onSelect={(classGroup, type) => {
                                this.setState(state => {
                                    const current = {
                                        type,
                                        ...classGroup
                                    };

                                    if (current.type === "group") {
                                        current.modelPath = `permissions.groups.${current.id}`;
                                    } else {
                                        current.modelPath = `permissions.${current.id}`;
                                    }

                                    state.classesGroups.current = current;
                                    console.log(state);
                                    return state;
                                });
                            }}
                        />
                    </Grid.Col>
                    <Grid.Col md={9} className={css.scope}>
                        <h3>{t`Operations`}</h3>
                        <h4>{t`Modify access to operations (create, read, update and delete).`}</h4>

                        <OperationsPermissions
                            model={this.props.model}
                            form={this.props.form}
                            classesGroups={this.state.classesGroups}
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
                        <br />
                        <br />

                        <h3>{t`Attributes`}</h3>
                        <h4>{t`Modify access to attributes.`}</h4>

                        <AttributesPermissions
                            form={this.props.form}
                            classesGroups={this.state.classesGroups}
                            holdingShift={this.state.holdingShift}
                        />

                        {/*       <br />
                        <br />
                        <h3>{t`Methods`}</h3>
                        <h4>{t`Modify access to methods.`}</h4>*/}
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

export default createComponent(Access, { modules: ["Grid"] });
