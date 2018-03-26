import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import ToggleAccessButton from './ToggleAccessButton';
import MethodTooltip from './MethodTooltip';

import styles from './styles.css';

/**
 * @i18n.namespace Webiny.Backend.Acl.EntityBox
 */
class ServiceBox extends Webiny.Ui.Component {
    constructor(props) {
        super(props);
        this.state = {serviceFilter: ''};
    }

    /**
     * Renders toggle buttons for custom API endpoints (if they exist on given service).
     */
    renderCustomMethods() {
        const {Input, Tooltip, service, permissions, currentlyEditingPermission, onTogglePermission} = this.props;

        let customMethods = [];

        _.each(service.methods, method => {
            const exposed = _.get(permissions, method.key, false);
            customMethods.push(_.assign({}, method, {exposed}));
        });

        let header = <h2 className={styles.customMethodsTitle}>{this.i18n(`Custom methods`)}</h2>;
        let content = <div className={styles.noCustomMethods}>{this.i18n(`No custom methods.`)}</div>

        if (_.isEmpty(customMethods)) {
            return (
                <div className={styles.customMethods}>
                    <header>{header}</header>
                    {content}
                </div>
            );
        }

        header = (
            <span>
                <h2 className={styles.customMethodsTitle}>{this.i18n(`Custom methods`)}</h2>
                <Input placeholder={this.i18n('Filter methods...')} {...this.bindTo('serviceFilter')} delay={0}/>
            </span>
        );

        let methods = customMethods.map(method => {
            if (method.url.indexOf(this.state.serviceFilter.toLowerCase()) === -1) {
                return;
            }

            return (
                <li key={method.key} className={styles.customMethodListItem}>
                    <Tooltip interactive target={(
                        <ToggleAccessButton
                            label={this.i18n(`E`)}
                            key={method.key}
                            method={method}
                            onClick={() => onTogglePermission(service.classId, method.key)}
                            value={method.exposed}/>
                    )}>
                        <MethodTooltip method={method} currentlyEditingPermission={currentlyEditingPermission}/>
                    </Tooltip>

                    <div className={styles.methodDetails}>
                        <div className={styles.methodTypeLabel}>
                            {method.method.toUpperCase()}
                        </div>
                        <div title={method.path} className={styles.methodPathLabel}>{method.path}</div>
                    </div>
                    <div className="clearfix"/>
                </li>
            );
        });

        // Filter out undefined values (when method filtering is active)
        methods = _.filter(methods, item => !_.isUndefined(item));
        content = _.isEmpty(methods) ? <div className={styles.noCustomMethods}>{this.i18n(`Nothing to show.`)}</div> :
            <ul className={styles.customMethodsList}>{methods}</ul>;

        return (
            <div>
                <header>{header}</header>
                {content}
            </div>
        );
    }
}

ServiceBox.defaultProps = {
    currentlyEditingPermission: null,
    service: {},
    permissions: {},
    onTogglePermission: _.noop,
    onRemoveService: _.noop,
    renderer() {
        const {ClickConfirm} = this.props;

        return (
            <div className="col-lg-4 col-md-6 col-sm-12 col-xs-12">
                <div className={styles.box}>
                    <div>
                        <h1 className={styles.title}>
                            {this.props.service.classId}<br/>
                            <small>{this.props.service.class}</small>
                        </h1>
                        <ClickConfirm
                            onComplete={() => this.props.onRemoveService(this.props.service)}
                            message={this.i18n('Are you sure you want to remove {service}?', {
                                service: <strong>{this.props.service.classId}</strong>
                            })}>
                            <span onClick={_.noop} className={styles.removeButton}>×</span>
                        </ClickConfirm>
                        {this.renderCustomMethods()}
                    </div>
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(ServiceBox, {
    modules: ['Input', 'ClickConfirm', 'Tooltip']
});
