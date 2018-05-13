import React from "react";
import css from "./EntitiesList.scss";
import { createComponent, i18n } from "webiny-app";
import _ from "lodash";
import classNames from "classnames";

const t = i18n.namespace("Security.PermissionsForm.Scopes.ClassesLists");

class EntitiesList extends React.Component {
    constructor() {
        super();
        this.state = {
            filter: null
        };
    }

    renderListItem(entity) {
        const { Checkbox } = this.props.modules;
        const selected = this.props.entities.current === entity;

        const modelPath = `permissions.entities.${entity.id}`;

        return (
            <li
                className={classNames({
                    [css.selected]: selected
                })}
                key={entity.name}
            >
                <div className={classNames(css.listItemWrapper, css.checkbox)}>
                    <Checkbox
                        value={_.get(this.props.model, modelPath)}
                        onChange={() => {
                            this.props.onToggle(entity);
                        }}
                    />
                </div>
                <div
                    className={css.listItemWrapper}
                    onClick={() => {
                        this.props.onSelect(entity);
                    }}
                >
                    <div className={css.name}>{entity.id}</div>
                    <div className={classNames(css.description)}>{entity.name}</div>
                </div>
            </li>
        );
    }

    render() {
        const { Input, Scrollbar } = this.props.modules;

        return (
            <div className={css.wrapper}>
                <Input
                    placeholder={t`Type to filter...`}
                    value={this.state.filter}
                    onChange={filter => {
                        this.setState({ filter });
                    }}
                />
                <Scrollbar style={{ height: 800 }} autoHide>
                    <ul>
                        {this.props.entities.list.map(entity => {
                            if (!_.isEmpty(this.state.filter)) {
                                if (
                                    entity.name
                                        .toLowerCase()
                                        .indexOf(this.state.filter.toLowerCase()) < 0 ||
                                    entity.id
                                        .toLowerCase()
                                        .indexOf(this.state.filter.toLowerCase()) < 0
                                ) {
                                    return null;
                                }
                            }
                            return this.renderListItem(entity);
                        })}
                    </ul>
                </Scrollbar>
            </div>
        );
    }
}

EntitiesList.defaultProps = {
    model: null,
    entities: null,
    onSelect: _.noop,
    onToggle: _.noop
};

export default createComponent(EntitiesList, {
    modules: ["Input", "Checkbox", "Scrollbar"]
});
