import React from "react";
import _ from "lodash";

import ToggleAccessButton from "./ToggleAccessButton";
import MethodTooltip from "./MethodTooltip";

import css from "./styles.css";

import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.endpointBox");

class EndpointBox extends React.Component {
    constructor(props) {
        super(props);
        this.state = { endpointFilter: "" };
    }

    methodIsExposed(endpoint, method) {
        const { currentlyEditingPermission } = this.props;
        let rule = _.find(currentlyEditingPermission.rules, { classId: endpoint.classId });
        if (!rule) {
            return false;
        }

        return _.find(rule.methods, { method: method.name });
    }

    /**
     * Renders toggle buttons for custom API endpoints (if they exist on given endpoint).
     */
    renderMethods() {
        const {
            Input,
            Tooltip,
            endpoint,
            permissions,
            currentlyEditingPermission,
            onToggleMethod
        } = this.props;

        let endpointMethods = [];

        _.each(endpoint.methods, method => {
            const exposed = _.get(permissions, method.key, false);
            endpointMethods.push(_.assign({}, method, { exposed }));
        });

        let content = <div className={css.noCustomMethods}>{t`No methods.`}</div>;

        if (_.isEmpty(endpointMethods)) {
            return <div className={css.customMethods}>{content}</div>;
        }

        let header = (
            <span>
                <Input
                    value={this.state.endpointFilter}
                    placeholder={t`Filter methods...`}
                    delay={0}
                    onChange={endpointFilter => {
                        this.setState({ endpointFilter });
                    }}
                />
            </span>
        );

        let methods = endpointMethods.map(method => {
            if (method.pattern.indexOf(this.state.endpointFilter.toLowerCase()) === -1) {
                return;
            }

            return (
                <li key={method.name} className={css.customMethodListItem}>
                    <Tooltip
                        interactive
                        target={
                            <ToggleAccessButton
                                label={t`E`}
                                key={method.name}
                                method={method}
                                onClick={() => onToggleMethod(endpoint.classId, method.name)}
                                exposed={this.methodIsExposed(endpoint, method)}
                            />
                        }
                    >
                        <MethodTooltip
                            method={method}
                            currentlyEditingPermission={currentlyEditingPermission}
                        />
                    </Tooltip>

                    <div className={css.methodDetails}>
                        <div className={css.methodTypeLabel}>{method.method.toUpperCase()}</div>
                        <div title={method.pattern} className={css.methodPathLabel}>
                            {method.pattern}
                        </div>
                    </div>
                    <div className="clearfix" />
                </li>
            );
        });

        // Filter out undefined values (when method filtering is active)
        methods = _.filter(methods, item => !_.isUndefined(item));
        content = _.isEmpty(methods) ? (
            <div className={css.noCustomMethods}>{t`Nothing to show.`}</div>
        ) : (
            <ul className={css.customMethodsList}>{methods}</ul>
        );

        return (
            <div>
                <header>{header}</header>
                {content}
            </div>
        );
    }

    render() {
        const { ClickConfirm } = this.props;

        return (
            <div className="col-lg-4 col-md-6 col-sm-12 col-xs-12">
                <div className={css.box}>
                    <div>
                        <h1 className={css.title}>
                            {this.props.endpoint.classId}
                            <br />
                            <small>{this.props.endpoint.url}</small>
                        </h1>

                        <ClickConfirm
                            onComplete={() => this.props.onRemoveEndpoint(this.props.endpoint)}
                            message={t`Are you sure you want to remove {endpoint}?`({
                                endpoint: <strong>{this.props.endpoint.classId}</strong>
                            })}
                        >
                            <span onClick={_.noop} className={css.removeButton}>
                                ×
                            </span>
                        </ClickConfirm>
                        {this.renderMethods()}
                    </div>
                </div>
            </div>
        );
    }
}

EndpointBox.defaultProps = {
    currentlyEditingPermission: null,
    endpoint: {},
    roles: {},
    onToggleMethod: _.noop,
    onRemoveEndpoint: _.noop
};

export default createComponent(EndpointBox, {
    modules: ["Input", "ClickConfirm", "Tooltip"]
});
