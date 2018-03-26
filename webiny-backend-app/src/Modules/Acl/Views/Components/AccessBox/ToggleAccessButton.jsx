import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

const crudLabels = {
    '/.post': 'C',
    '{id}.get': 'R',
    '/.get': 'R',
    '{id}.patch': 'U',
    '{id}.delete': 'D'
};

/**
 * @i18n.namespace Webiny.Backend.Acl.ToggleAccessButton
 */
class ToggleAccessButton extends Webiny.Ui.Component {
    renderLabel() {
        if (this.props.label) {
            return this.props.label;
        }

        const key = this.props.method.key;
        return crudLabels[key] || 'E';
    }
}

ToggleAccessButton.defaultProps = {
    label: null,
    method: null,
    value: false,
    onClick: _.noop,
    renderer() {
        const {Button, method, onClick, value} = this.props;
        return (
            <div className={styles.toggleAccessButtonWrapper} ref={ref => this.ref = ref}>
                {method.public ? (
                    <Button type="primary" className={this.classSet(styles.toggleAccessButton, styles.toggleAccessButtonPublic)}>
                        {this.i18n(`P`)}
                    </Button>
                ) : (
                    <Button
                        type="primary"
                        onClick={() => {
                            this.ref.querySelector('button').blur();
                            onClick();
                        }}
                        className={this.classSet(styles.toggleAccessButton, {[styles.toggleAccessButtonExposed]: value})}>
                        {this.renderLabel()}
                    </Button>
                )}
            </div>
        );
    }
};

export default Webiny.createComponent(ToggleAccessButton, {
    modules: ['Button']
});
