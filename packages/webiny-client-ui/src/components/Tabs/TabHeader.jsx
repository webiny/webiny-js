import React from 'react';
import _ from 'lodash';
import classSet from "classnames";
import { i18n, createComponent } from 'webiny-client';
import styles from './styles.css?prefix=wui-tabs';

const t = i18n.namespace("Webiny.Ui.Tabs");
class TabHeader extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const css = {};
        css[this.props.activeTabClassName] = this.props.active;
        css[this.props.disabledTabClassName] = this.props.disabled;
        css[this.props.styles.stretch] = this.props.stretch;

        return (
            <li className={classSet(css)} onClick={this.props.onClick}>{this.props.renderLabel.call(this)}</li>
        );
    }
}

TabHeader.defaultProps = {
    label: t`Tab`,
    onClick: _.noop,
    icon: null,
    stretch: false,
    disabled: false, // "private" prop passed by Tabs component
    activeTabClassName: styles.active, // "private" prop for render purposes only
    disabledTabClassName: styles.disabled, // "private" prop for render purposes only
    active: false, // "private" prop passed by Tabs component
    renderLabel() {
        let label = this.props.label;
        const styles = this.props.styles;

        // TODO: const i18n = React.isValidElement(label) && isElementOfType(label, i18n.getComponent());
        // if (_.isString(this.props.label) || i18n) {
        if (_.isString(this.props.label)) {
            const { Icon } = this.props.modules;
            label = (
                <a href="javascript:void(0)">
                    {this.props.icon ? <Icon icon={this.props.icon}/> : null}
                    <span className={styles.headerLabel}>{label}</span>
                </a>
            );
        }
        return label;
    }
};

export default createComponent(TabHeader, { modules: ['Icon'], styles });