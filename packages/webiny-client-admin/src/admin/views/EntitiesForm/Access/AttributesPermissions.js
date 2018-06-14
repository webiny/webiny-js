import React from "react";
import classNames from "classnames";
import css from "./AttributesPermissions.scss";
import { inject, app } from "webiny-client";
import _ from "lodash";
import gql from "graphql-tag";
import AttributeTooltip from "./AttributesPermissions/AttributeTooltip";

@inject({ modules: ["Icon", "Tooltip"] })
class AttributesPermissions extends React.Component {
    constructor() {
        super();
        this.state = {
            latestToggledAttribute: null
        };
    }

    saveAttributeChange(attr, type = null) {
        const current = this.props.classesGroups.current;

        const mutation = gql`
            mutation {
                toggleEntityAttributePermission(
                    id: "${app.router.getParams("id")}"
                    class: "${current.id}"
                    attribute: "${attr.name}"
                    type: "${type}"
                ) {
                   entity { id attributes } permissions { owner group other }
                }
            }
        `;

        app.graphql.mutate({ mutation }).then(({ data }) => {
            this.props.form.setState({ model: data.toggleEntityAttributePermission });
        });
    }

    toggleAttribute(event, attr, type) {
        event.stopPropagation();
        event.preventDefault();

        if (!this.props.holdingShift) {
            this.saveAttributeChange(attr, type);
            this.setState({ latestToggledAttribute: attr });
            return;
        }

        /*  if (!this.state.latestToggledAttribute) {
            return;
        }

        const latestToggledAttributeIndex = attr.indexOf(attr);

        let paths = null;
        if (index > latestToggledAttributeIndex) {
            paths = returnType.fields.slice(latestToggledAttributeIndex, index + 1).map(field => {
                return `${initialPath}.${field.name}`;
            });
        } else {
            paths = returnType.fields
                .slice(index, latestToggledAttributeIndex + 1)
                .map(field => {
                    return `${initialPath}.${field.name}`;
                })
                .reverse();
        }

        this.props.onMultiToggle(paths);
        this.setState({ latestToggledAttribute: attr });*/
    }

    render() {
        const { model } = this.props.form.state;

        if (!model) {
            return null;
        }
        const { Icon, Tooltip } = this.props.modules;
        const initialPath = this.props.initialPath;
        return (
            <ul className={css.attributesPermissions}>
                {model.entity.attributes.map(attr => {
                    let attributeModelPath = `${
                        this.props.classesGroups.current.modelPath
                    }.attributes`;
                    if (initialPath) {
                        attributeModelPath += `.${initialPath}.${attr.name}`;
                    } else {
                        attributeModelPath += `.${attr.name}`;
                    }

                    const active = {
                        read: _.get(model, attributeModelPath + ".read"),
                        write: _.get(model, attributeModelPath + ".write"),
                        both: false
                    };

                    active.both = active.read && active.write;

                    return (
                        <li key={attributeModelPath}>
                            <div
                                className={classNames(css.attribute, {})}
                                onClick={event => {
                                    this.toggleAttribute(event, attr);
                                }}
                            >
                                <div className={css.attributeName}>{attr.name}</div>
                                <div
                                    className={classNames(css.readWriteButton, css.linkedEntities)}
                                >
                                    <Tooltip
                                        trigger="click"
                                        target={<Icon icon={["fas", "link"]} />}
                                    >
                                        <AttributeTooltip form={this.props.form} />
                                    </Tooltip>
                                </div>
                                <div
                                    className={classNames(css.readWriteButton, {
                                        [css.active]: active.write
                                    })}
                                    onClick={event => {
                                        this.toggleAttribute(event, attr, "write");
                                    }}
                                >
                                    W
                                </div>
                                <div
                                    className={classNames(css.readWriteButton, {
                                        [css.active]: active.read
                                    })}
                                    onClick={event => {
                                        this.toggleAttribute(event, attr, "read");
                                    }}
                                >
                                    R
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        );
    }
}

AttributesPermissions.defaultProps = {
    form: null,
    holdingShift: null,
    classesGroups: null
};

export default AttributesPermissions;
