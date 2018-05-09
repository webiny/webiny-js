import React from "react";
import css from "./Permissions.scss";
import { createComponent, i18n, app } from "webiny-app";
import gql from "graphql-tag";

import _ from "lodash";
// import FieldsList from "./Permissions/FieldsList";
import ToggleAccessButton from "./Permissions/ToggleAccessButton";

const t = i18n.namespace("Security.EntitiesForm.Access.Permissions.ToggleAccessButton");

class Permissions extends React.Component {
    constructor() {
        super();
        this.state = { holdingShift: false };

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

    toggleOperation(name) {
        const current = this.props.classesGroups.current;
        const modelPath = current.modelPath + ".operations." + name;

        console.log(current);
        this.props.form.setState(state => {
            if (_.get(state.model, modelPath)) {
                _.unset(state.model, modelPath);
            } else {
                _.set(state.model, modelPath, true);
            }
            return state;
        });

        const mutation = gql`
            mutation {
                toggleEntityPermission(
                    id: "${app.router.getParams("id")}"
                    class: "${current.id}"
                    permission: { type: "operations", name: "${name}" }
                ) {
                    id
                    owner
                    group
                    other
                }
            }
        `;

        app.graphql.mutate({ mutation }).then(({ data }) => {
            this.props.form.setState({ model: data.toggleEntityPermission });
        });
    }

    render() {
        if (!this.props.classesGroups.current) {
            return null;
        }

        const { modelPath } = this.props.classesGroups.current;

        return (
            <div className={css.permissions}>
                <div className={css.crud}>
                    <div className="row">
                        <div className="col-md-12">
                            <ToggleAccessButton
                                value={_.get(this.props.model, `${modelPath}.operations.create`)}
                                label={t`C`}
                                onClick={() => {
                                    this.toggleOperation("create");
                                }}
                            />
                            <ToggleAccessButton
                                value={_.get(this.props.model, `${modelPath}.operations.read`)}
                                label={t`R`}
                                onClick={() => {
                                    this.toggleOperation("read");
                                }}
                            />
                            <ToggleAccessButton
                                value={_.get(this.props.model, `${modelPath}.operations.update`)}
                                label={t`U`}
                                onClick={() => {
                                    this.toggleOperation("update");
                                }}
                            />
                            <ToggleAccessButton
                                value={_.get(this.props.model, `${modelPath}.operations.delete`)}
                                label={t`D`}
                                onClick={() => {
                                    this.toggleOperation("delete");
                                }}
                            />
                        </div>
                    </div>
                </div>
                {/*<FieldsList
                    model={this.props.model}
                    field={this.props.selectedQueryMutationField}
                    initialPath={this.props.selectedQueryMutationField.name}
                    schema={this.props.schema}
                    holdingShift={this.state.holdingShift}
                    onToggle={this.props.onToggle}
                    onMultiToggle={this.props.onMultiToggle}
                />*/}
            </div>
        );
    }
}

Permissions.defaultProps = {
    classesGroups: null,
    model: null,
    form: null,
    onToggleBaseOperation: _.noop,
    onMultiToggle: _.noop
};

export default createComponent(Permissions, { modules: [] });
