import React from "react";
import css from "./Permissions.scss";
import { createComponent, i18n } from "webiny-app";
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

    toggleBaseOperation(operation) {
        const current = this.props.classesRoles.current;
        const modelPath = current.modelPath + "." + operation;

        console.log(modelPath);
        this.props.form.setState(state => {
            if (_.get(state.model, modelPath)) {
                _.unset(state.model, modelPath);
            } else {
                _.set(state.model, modelPath, true);
            }
            return state;
        });
    }

    render() {
        if (!this.props.classesRoles.current) {
            return null;
        }

        const { modelPath } = this.props.classesRoles.current;

        return (
            <div className={css.permissions}>
                <div className={css.crud}>
                    <div className="row">
                        <div className="col-md-12">
                            <ToggleAccessButton
                                value={_.get(this.props.model, `${modelPath}.create`)}
                                label={t`C`}
                                onClick={() => {
                                    this.toggleBaseOperation("create");
                                }}
                            />
                            <ToggleAccessButton
                                value={_.get(this.props.model, `${modelPath}.read`)}
                                label={t`R`}
                                onClick={() => {
                                    this.toggleBaseOperation("read");
                                }}
                            />
                            <ToggleAccessButton
                                value={_.get(this.props.model, `${modelPath}.update`)}
                                label={t`U`}
                                onClick={() => {
                                    this.toggleBaseOperation("update");
                                }}
                            />
                            <ToggleAccessButton
                                value={_.get(this.props.model, `${modelPath}.delete`)}
                                label={t`D`}
                                onClick={() => {
                                    this.toggleBaseOperation("delete");
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
    classesRoles: null,
    model: null,
    form: null,
    onToggleBaseOperation: _.noop,
    onMultiToggle: _.noop
};

export default createComponent(Permissions, { modules: [] });
