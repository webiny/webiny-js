import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

/**
 * @i18n.namespace Webiny.Ui.Tabs
 */
class TabHeader extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.bindMethods('renderLabel');
    }

    renderLabel() {
        return this.props.labelRenderer.call(this);
    }
}

TabHeader.defaultProps = {
    label: Webiny.I18n('Tab'),
    onClick: _.noop,
    icon: null,
    disabled: false, // "private" prop passed by Tabs component
    activeTabClassName: styles.active, // "private" prop for render purposes only
    disabledTabClassName: styles.disabled, // "private" prop for render purposes only
    active: false, // "private" prop passed by Tabs component
    labelRenderer() {
        let label = this.props.label;
        const styles = this.props.styles;

        const i18n = React.isValidElement(label) && Webiny.isElementOfType(label, Webiny.I18n.getComponent());
        if (_.isString(this.props.label) || i18n) {
            const {Icon} = this.props;
            label = (
                <a href="javascript:void(0);">
                    {this.props.icon ? <Icon icon={'left ' + this.props.icon}/> : null}
                    <span className={styles.headerLabel}>{label}</span>
                </a>
            );
        }
        return label;
    },
    renderer() {
        const css = {};
        css[this.props.activeTabClassName] = this.props.active;
        css[this.props.disabledTabClassName] = this.props.disabled;

        return (
            <li className={this.classSet(css)} onClick={this.props.onClick}>{this.renderLabel()}</li>
        );
    }
};

export default Webiny.createComponent(TabHeader, {modules: ['Icon'], styles});