import React from "react";
import classNames from "classnames";
import css from "./FieldsList.scss";
import { createComponent } from "webiny-app";
import _ from "lodash";

class FieldsList extends React.Component {
    constructor() {
        super();
        this.state = {
            latestToggledField: null
        };
    }

    getType(name) {
        return _.find(this.props.schema.types, { name });
    }

    render() {
        const field = this.props.field;
        const initialPath = this.props.initialPath;

        const fieldReturnType = _.get(field.type, "ofType.name", field.type.name);
        const returnType = this.getType(fieldReturnType);

        if (!returnType || !returnType.fields) {
            return null;
        }

        return (
            <ul className={css.fieldsList}>
                {returnType.fields.map((field, index) => {
                    let fieldPath = `${initialPath}.${field.name}`;
                    const active = _.has(this.props.model.scope, fieldPath);
                    return (
                        <li key={fieldPath}>
                            <div
                                className={classNames(css.field, {
                                    [css.active]: active
                                })}
                                onClick={event => {
                                    event.stopPropagation();
                                    event.preventDefault();

                                    if (!this.props.holdingShift) {
                                        this.props.onToggle(fieldPath);
                                        this.setState({ latestToggledField: field });
                                        return;
                                    }

                                    if (!this.state.latestToggledField) {
                                        return;
                                    }

                                    const latestToggledFieldIndex = returnType.fields.indexOf(
                                        this.state.latestToggledField
                                    );

                                    let paths = null;
                                    if (index > latestToggledFieldIndex) {
                                        paths = returnType.fields
                                            .slice(latestToggledFieldIndex, index + 1)
                                            .map(field => {
                                                return `${initialPath}.${field.name}`;
                                            });
                                    } else {
                                        paths = returnType.fields
                                            .slice(index, latestToggledFieldIndex + 1)
                                            .map(field => {
                                                return `${initialPath}.${field.name}`;
                                            })
                                            .reverse();
                                    }

                                    this.props.onMultiToggle(paths);
                                    this.setState({ latestToggledField: field });
                                }}
                            >
                                {field.name}
                            </div>
                            {active && (
                                <FieldsList
                                    model={this.props.model}
                                    field={field}
                                    initialPath={fieldPath}
                                    schema={this.props.schema}
                                    holdingShift={this.props.holdingShift}
                                    onToggle={this.props.onToggle}
                                    onMultiToggle={this.props.onMultiToggle}
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        );
    }
}

FieldsList.defaultProps = {
    schema: null,
    model: null,
    selectedQueryMutationField: null,
    onToggle: _.noop,
    onMultiToggle: _.noop,
    holdingShift: null,
    field: null,
    initialPath: null
};

export default createComponent(FieldsList, { modules: [] });
