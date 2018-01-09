import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import RouteAction from './Actions/RouteAction';
import styles from '../../styles.css';

class Field extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.bindMethods('getTdClasses');
    }

    getTdClasses(classes = {}) {
        const coreClasses = {};
        coreClasses[this.props.sortedClass] = this.props.sorted !== null;
        coreClasses[this.props.alignLeftClass] = this.props.align === 'left';
        coreClasses[this.props.alignRightClass] = this.props.align === 'right';
        coreClasses[this.props.alignCenterClass] = this.props.align === 'center';
        return this.classSet(coreClasses, this.props.className, classes);
    }
}

Field.defaultProps = {
    default: '-',
    includeTd: true,
    align: 'left',
    className: null,
    sortedClass: styles.sorted,
    alignLeftClass: 'text-left',
    alignRightClass: 'text-right',
    alignCenterClass: 'text-center',
    route: null,
    params: null,
    hide: false,
    renderer() {
        let content = this.props.children;
        if (!_.isFunction(content) && _.isEmpty(content)) {
            content = _.get(this.props.data, this.props.name, this.props.default);
        }

        if (_.isFunction(content)) {
            content = content.call(this, {data: this.props.data, $this: this});
        }

        if (this.props.route) {
            content = (
                <RouteAction route={this.props.route} data={this.props.data} params={this.props.params}>
                    {content}
                </RouteAction>
            );
        }

        return this.props.includeTd ?
            <td className={this.getTdClasses()} data-th={Webiny.I18n.toText(this.props.label)}>{content}</td>
            : content;
    }
};

export default Webiny.createComponent(Field, {styles, tableField: true});