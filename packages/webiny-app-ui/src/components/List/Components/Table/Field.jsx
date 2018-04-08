import React from "react";
import _ from "lodash";
import classSet from "classnames";
import { createComponent, i18n } from "webiny-app";
import RouteAction from "./Actions/RouteAction";
import styles from "../../styles.css";

class Field extends React.Component {
    constructor(props) {
        super(props);

        this.getTdClasses = this.getTdClasses.bind(this);
    }

    shouldComponentUpdate(props) {
        if (!props.name && props.rowSelected !== this.props.rowSelected) {
            return true;
        }

        const check = ['data', 'sorted', 'rowSelected'];
        return !_.isEqual(_.pick(this.props, check), _.pick(props, check));
    }

    getTdClasses(classes = {}) {
        const coreClasses = {};
        coreClasses[this.props.sortedClass] = this.props.sorted !== null;
        coreClasses[this.props.alignLeftClass] = this.props.align === "left";
        coreClasses[this.props.alignRightClass] = this.props.align === "right";
        coreClasses[this.props.alignCenterClass] = this.props.align === "center";
        return classSet(coreClasses, this.props.className, classes);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let content = this.props.children;
        if (!_.isFunction(content) && _.isEmpty(content)) {
            content = _.get(this.props.data, this.props.name, this.props.default);
        }

        if (_.isFunction(content)) {
            content = content.call(this, { data: this.props.data, $this: this });
        }

        if (this.props.route) {
            content = (
                <RouteAction
                    route={this.props.route}
                    data={this.props.data}
                    params={this.props.params}
                >
                    {content}
                </RouteAction>
            );
        }

        // TODO: data-th={i18n.toText(this.props.label)}

        return this.props.includeTd ? <td className={this.getTdClasses()}>{content}</td> : content;
    }
}

Field.defaultProps = {
    default: "-",
    includeTd: true,
    align: "left",
    className: null,
    sortedClass: styles.sorted,
    alignLeftClass: "text-left",
    alignRightClass: "text-right",
    alignCenterClass: "text-center",
    route: null,
    params: null,
    hide: false
};

export default createComponent(Field, { styles, tableField: true });
