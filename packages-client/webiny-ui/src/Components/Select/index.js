import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import SimpleSelect from './SimpleSelect';

class Select extends Webiny.Ui.OptionComponent {

    constructor(props) {
        super(props);
        this.bindMethods('getCurrentData,getPreviousData,renderSelect');
    }

    getCurrentData() {
        return this.input ? this.input.getCurrentData() : null;
    }

    getPreviousData() {
        return this.input ? this.input.getPreviousData() : null;
    }

    renderSelect() {
        const props = _.pick(this.props, _.keys(_.omit(SimpleSelect.defaultProps, ['renderer'])));
        _.assign(props, {
            ref: select => this.input = select,
            options: this.state.options,
            disabled: this.isDisabled(),
            placeholder: this.getPlaceholder(),
            onChange: newValue => {
                this.props.onChange(newValue, !this.isValid() ? this.validate : _.noop);
            }
        });

        return <SimpleSelect {...props}/>;
    }
}

Select.defaultProps = Webiny.Ui.OptionComponent.extendProps({
    allowClear: false,
    autoSelectFirstOption: false,
    minimumInputLength: 0,
    minimumResultsForSearch: 15,
    dropdownParent: '.dropdown-wrapper',
    dropdownClassName: null,
    optionRenderer: null,
    selectedRenderer: null,
    renderer() {
        const {FormGroup} = this.props;

        return (
            <FormGroup valid={this.state.isValid} className={this.props.className}>
                {this.renderLabel()}
                {this.renderSelect()}
                {this.renderDescription()}
                {this.renderValidationMessage()}
            </FormGroup>
        );
    }
});

export default Webiny.createComponent(Select, {modules: ['FormGroup'], api: ['loadOptions', 'getCurrentData', 'getPreviousData']});