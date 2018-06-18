import React from "react";
import css from "./OperationsPermissions.module.scss";
import { inject, i18n, app } from "webiny-client";
import gql from "graphql-tag";

import _ from "lodash";
import TogglePermissionButton from "./../../components/TogglePermissionButton";

const t = i18n.namespace("Security.EntitiesForm.Access.Permissions.TogglePermissionButton");

@inject({ modules: [] })
class OperationsPermissions extends React.Component {
    toggleOperation(name) {
        const current = this.props.classesGroups.current;

        const mutation = gql`
            mutation {
                toggleEntityOperationPermission(
                    id: "${app.router.getParams("id")}"
                    class: "${current.id}"
                    permission: { type: "operations", name: "${name}" }
                ) {
                   entity { id attributes } permissions { owner group other }
                }
            }
        `;

        app.graphql.mutate({ mutation }).then(({ data }) => {
            this.props.form.setState({ model: data.toggleEntityOperationPermission });
        });
    }

    render() {
        if (!this.props.classesGroups.current) {
            return null;
        }

        const { modelPath } = this.props.classesGroups.current;
        return (
            <div className={css.operationsPermissions}>
                <div className={css.crud}>
                    <div className="row">
                        <div className="col-md-12">
                            <TogglePermissionButton
                                value={_.get(this.props.model, `${modelPath}.operations.create`)}
                                label={t`C`}
                                onClick={() => {
                                    this.toggleOperation("create");
                                }}
                            />
                            <TogglePermissionButton
                                value={_.get(this.props.model, `${modelPath}.operations.read`)}
                                label={t`R`}
                                onClick={() => {
                                    this.toggleOperation("read");
                                }}
                            />
                            <TogglePermissionButton
                                value={_.get(this.props.model, `${modelPath}.operations.update`)}
                                label={t`U`}
                                onClick={() => {
                                    this.toggleOperation("update");
                                }}
                            />
                            <TogglePermissionButton
                                value={_.get(this.props.model, `${modelPath}.operations.delete`)}
                                label={t`D`}
                                onClick={() => {
                                    this.toggleOperation("delete");
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

OperationsPermissions.defaultProps = {
    classesGroups: null,
    model: null,
    form: null
};

export default OperationsPermissions;
