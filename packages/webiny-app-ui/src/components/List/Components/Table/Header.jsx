import React from "react";
import { createComponent } from "webiny-app";
import classSet from "classnames";
import styles from "../../styles.css?prefix=Webiny_Ui_Table_Header";

class Header extends React.Component {
    constructor(props) {
        super(props);

        this.toggleSorter = this.toggleSorter.bind(this);
    }

    toggleSorter() {
        let sort = 0;
        switch (this.props.sorted) {
            case 0:
                sort = -1;
                break;
            case -1:
                sort = 1;
                break;
            default:
                sort = 0;
        }

        this.props.onSort(this.props.sort, sort);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        let classes = {};
        if (this.props.sorted && this.props.sorted !== 0) {
            classes[styles.sorted] = true;
        }

        classes[this.props.alignLeftClass] = this.props.align === "left";
        classes[this.props.alignRightClass] = this.props.align === "right";
        classes[this.props.alignCenterClass] = this.props.align === "center";

        let sortIcon;
        switch (this.props.sorted) {
            case 1:
                sortIcon = this.props.sortedAscendingIcon;
                break;
            case -1:
                sortIcon = this.props.sortedDescendingIcon;
                break;
            default:
                sortIcon = this.props.sortableIcon;
        }

        const { Icon } = this.props.modules;
        const icon = this.props.sortable ? <Icon icon={sortIcon} /> : null;

        let content = this.props.label;
        if (this.props.sortable) {
            content = (
                <a href="javascript:void(0);" onClick={this.toggleSorter}>
                    {this.props.label}
                    {icon}
                </a>
            );
        }

        return (
            <th className={classSet(classes)}>
                {this.props.children}
                {content}
            </th>
        );
    }
}

Header.defaultProps = {
    align: "left",
    alignLeftClass: "text-left",
    alignRightClass: "text-right",
    alignCenterClass: "text-center",
    sortedAscendingIcon: ["fas", "sort-up"],
    sortedDescendingIcon: ["fas", "sort-down"],
    sortableIcon: ["fas", "sort"]
};

export default createComponent(Header, { modules: ["Icon"], styles });
