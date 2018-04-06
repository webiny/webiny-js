import React from "react";
import _ from "lodash";

import styles from "./styles.css";
import { i18n, createComponent } from "webiny-app";
const t = i18n.namespace("Security.MethodTooltip");

class MethodTooltip extends React.Component {
    render() {
        const { Link, method, currentlyEditingPermission } = this.props;
        return (
            <div className={styles.detailsTooltip}>
                {method.name &&
                    method.description && (
                        <tooltip-header>
                            <h3>
                                {method.name}{" "}
                                {method.public && (
                                    <span className={styles.publicMethod}>{t`(public)`}</span>
                                )}
                            </h3>
                            {method.description && <div>{method.description}</div>}
                            <br />
                        </tooltip-header>
                    )}

                <h3>{t`Execution:`}</h3>
                <div>
                    <div className={styles.methodBox}>{method.method}</div>
                    {method.pattern}
                </div>
                <br />

                {_.isEmpty(method.usages) ? (
                    <tooltip-wrapper>
                        <h3>{t`Usages`}</h3>
                        <div>{t`No usages.`}</div>
                    </tooltip-wrapper>
                ) : (
                    <tooltip-wrapper>
                        <h3>{t`Usages ({total})`({ total: method.usages.length })}</h3>
                        <div>
                            <table className={styles.usagesTable}>
                                <thead>
                                    <tr>
                                        <th>{t`Permission`}</th>
                                        <th>{t`Roles`}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {method.usages.map(permission => (
                                        <tr key={permission.id}>
                                            <td>
                                                {permission.id === currentlyEditingPermission.id ? (
                                                    <span>{permission.name}</span>
                                                ) : (
                                                    <Link
                                                        separate
                                                        route="Permissions.Edit"
                                                        params={{ id: permission.id }}
                                                    >
                                                        {permission.name}
                                                    </Link>
                                                )}
                                            </td>
                                            <td
                                                className={this.classSet({
                                                    [styles.moreRoles]: true
                                                })}
                                            >
                                                {permission.roles.map(role => (
                                                    <Link
                                                        separate
                                                        key={role.id}
                                                        route="Roles.Edit"
                                                        params={{ id: role.id }}
                                                    >
                                                        {role.name}
                                                    </Link>
                                                ))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </tooltip-wrapper>
                )}
            </div>
        );
    }
}

MethodTooltip.defaultProps = {
    method: null
};

export default createComponent(MethodTooltip, {
    modules: ["Link"]
});
