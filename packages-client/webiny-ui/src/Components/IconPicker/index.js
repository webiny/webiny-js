import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import icons from './icons';

/**
 * @i18n.namespace Webiny.Ui.IconPicker
 */
class IconPicker extends Webiny.Ui.Component {
    constructor(props){
        super(props);

        this.bindMethods('optionRenderer', 'selectedRenderer');
    }

    optionRenderer({option, ...params}) {
        if (this.props.optionRenderer) {
            return this.props.optionRenderer({option, ...params});
        }

        const {Icon} = this.props;
        return (
            <div><Icon icon={'fa ' + option.id}/> {option.text}</div>
        );
    }

    selectedRenderer({option, ...params}) {
        if (this.props.selectedRenderer) {
            return this.props.selectedRenderer({option, ...params});
        }

        const {Icon} = this.props;
        return (
            <div><Icon icon={'fa ' + option.id}/> {option.text}</div>
        );
    }
}

IconPicker.defaultProps = {
    minimumInputLength: 2,
    tooltip: Webiny.I18n('Visit http://fontawesome.io for full list'),
    optionRenderer: null,
    selectedRenderer: null,
    renderer() {
        const props = _.omit(this.props, ['renderer']);
        props.optionRenderer = this.optionRenderer;
        props.selectedRenderer = this.selectedRenderer;
        const {Select} = this.props;

        return <Select {...props} options={icons}/>;
    }
};

export default Webiny.createComponent(IconPicker, {modules: ['Select', 'Icon']});