import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class MethodTooltip extends Webiny.Ui.Component {
}

/**
 * @i18n.namespace Webiny.Backend.Acl.MethodTooltip
 */
MethodTooltip.defaultProps = {
    method: null,
    renderer() {
        const {Link, method, currentlyEditingPermission} = this.props;
        return (
            <div className={styles.detailsTooltip}>
                {method.name && method.description && (
                    <tooltip-header>
                        <h3>
                            {method.name} {method.public && <span className={styles.publicMethod}>{this.i18n(`(public)`)}</span>}
                        </h3>
                        {method.description && <div>{method.description}</div>}
                        <br/>
                    </tooltip-header>
                )}

                <h3>{this.i18n(`Execution:`)}</h3>
                <div>
                    <div className={styles.methodBox}>{method.method}</div>
                    {method.path}
                </div>
                <br/>

                {_.isEmpty(method.usages) ? (
                    <wrapper>
                        <h3>{this.i18n(`Usages`)}</h3>
                        <div>
                            No usages.
                        </div>
                    </wrapper>
                ) : (
                    <wrapper>
                        <h3>{this.i18n(`Usages ({total}):`, {total: method.usages.length})}</h3>
                        <div>
                            <table className={styles.usagesTable}>
                                <thead>
                                <tr>
                                    <th>{this.i18n(`Permission`)}</th>
                                    <th>{this.i18n(`Roles`)}</th>
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
                                                    route="UserPermissions.Edit"
                                                    params={{id: permission.id}}>
                                                    {permission.name}
                                                </Link>
                                            )}
                                        </td>
                                        <td className={this.classSet({[styles.moreRoles]: true})}>
                                            {permission.roles.map(role => (
                                                <Link
                                                    separate
                                                    key={role.id}
                                                    route="UserRoles.Edit"
                                                    params={{id: role.id}}>
                                                    {role.name}
                                                </Link>
                                            ))}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </wrapper>
                )}

            </div>
        );
    }
};

export default Webiny.createComponent(MethodTooltip, {
    modules: ['Link']
});