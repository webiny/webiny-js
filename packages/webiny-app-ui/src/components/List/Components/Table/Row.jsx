import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { createComponent, isElementOfType, elementHasFlag } from "webiny-app";
import SelectRowField from "./Fields/SelectRowField";
import Actions from "./Actions";
import FieldInfo from "./FieldInfo";
import styles from "../../styles.css";

class Row extends React.Component {
    constructor(props) {
        super(props);

        this.fields = [];
        this.actionsElement = null;
        this.selectRowElement = null;
        this.data = props.data;

        ["prepareChildren", "prepareChild", "renderField", "onClick", "isDisabled"].map(
            m => (this[m] = this[m].bind(this))
        );
    }

    componentWillMount() {
        this.prepareChildren(this.props.children);
        if (this.props.attachToTable) {
            this.props.attachToTable(this, this.props.index);
        }
    }

    componentWillReceiveProps(props) {
        this.data = props.data;
        this.prepareChildren(props.children);
        if (this.props.attachToTable) {
            this.props.attachToTable(this, props.index);
        }
    }

    shouldComponentUpdate(props) {
        const check = ["data", "expanded", "selected", "sorters"];

        return !_.isEqual(_.pick(this.props, check), _.pick(props, check));
    }

    isDisabled() {
        const { disabled } = this.props;
        return _.isFunction(disabled) ? disabled(this.props.data) : disabled;
    }

    prepareChild(child) {
        if (typeof child !== "object" || child === null) {
            return child;
        }

        const tableField = elementHasFlag(child, "tableField");
        if (tableField) {
            if (isElementOfType(child, SelectRowField)) {
                this.selectRowElement = true;
            }

            // Only evaluate `hide` condition if it is a plain value (not a function)
            if (!_.isFunction(child.props.hide) && child.props.hide) {
                return;
            }

            this.fields.push(child);
            return;
        }

        const tableActions = isElementOfType(child, Actions);
        if (tableActions && !child.props.hide) {
            this.actionsElement = React.cloneElement(child, {
                data: this.data,
                actions: this.props.actions
            });
        }
    }

    prepareChildren(children) {
        this.fields = [];
        this.actionsElement = null;

        if (typeof children !== "object" || children === null) {
            return children;
        }
        return React.Children.map(children, this.prepareChild);
    }

    renderField(field, i) {
        const props = _.omit(field.props, ["children"]);
        _.assign(props, {
            data: this.data,
            name: props.name,
            label: props.label,
            key: i,
            sorted: this.props.sorters[props.name] || null,
            actions: this.props.actions,
            rowIndex: this.props.index,
            rowDetailsExpanded: this.props.expanded,
            rowSelected: this.props.selected,
            rowDisabled: this.isDisabled(),
            onSelect: value => this.props.onSelect(this.props.data, value),
            onSelectAll: value => this.props.onSelectAll(value)
        });

        // Filter Field children
        const childrenArray = _.isArray(field.props.children)
            ? field.props.children
            : [field.props.children];
        const children = [];
        _.filter(childrenArray).map(fieldChild => {
            // Do not include FieldInfo in Field children
            if (!isElementOfType(fieldChild, FieldInfo)) {
                children.push(fieldChild);
            }
        });

        return React.cloneElement(field, props, children.length === 1 ? children[0] : children);
    }

    onClick() {
        const onClick = this.props.onClick;
        if (_.isString(onClick) && onClick === "toggleRowDetails") {
            this.props.actions.toggleRowDetails(this.props.index)();
        } else if (_.isFunction(onClick)) {
            onClick.call(this, { data: this.data, $this: this });
        }
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (this.props.onSelect && !this.selectRowElement) {
            this.fields.splice(0, 0, <SelectRowField />);
        }

        let classes = this.props.className;
        if (_.isFunction(classes)) {
            classes = classes(this.props.data);
        }

        return (
            <tr
                className={classSet(classes, this.props.selected && styles.selected)}
                onClick={this.onClick}
            >
                {this.fields.map(this.renderField)}
                {this.actionsElement ? (
                    <td className={this.props.actionsClass}>{this.actionsElement}</td>
                ) : null}
            </tr>
        );
    }
}

Row.defaultProps = {
    className: null,
    onClick: _.noop,
    disabled: false,
    actionsClass: "text-center"
};

export default createComponent(Row, { styles });
