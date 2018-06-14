import React from "react";
import css from "./FieldsSelector.scss";
import { inject } from "webiny-client";
import _ from "lodash";
import FieldsList from "./FieldsSelector/FieldsList";

@inject({ modules: [] })
class FieldsSelector extends React.Component {
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

    render() {
        return (
            <div className={css.fieldsSelector}>
                <FieldsList
                    model={this.props.model}
                    field={this.props.selectedQueryMutationField}
                    initialPath={this.props.selectedQueryMutationField.name}
                    schema={this.props.schema}
                    holdingShift={this.state.holdingShift}
                    onToggle={this.props.onToggle}
                    onMultiToggle={this.props.onMultiToggle}
                />
            </div>
        );
    }
}

FieldsSelector.defaultProps = {
    schema: null,
    model: null,
    selectedQueryMutationField: null,
    onToggle: _.noop,
    onMultiToggle: _.noop
};

export default FieldsSelector;
