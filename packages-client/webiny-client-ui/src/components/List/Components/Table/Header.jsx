import React from 'react';
import { createComponent } from 'webiny-client';
import classSet from "classnames";
import styles from '../../styles.css';

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
        if(this.props.sorted && this.props.sorted !== 0){
            classes[styles.sorted] = true;
        }

        classes[this.props.alignLeftClass] = this.props.align === 'left';
        classes[this.props.alignRightClass] = this.props.align === 'right';
        classes[this.props.alignCenterClass] = this.props.align === 'center';

        const sortIcon = {};
        sortIcon[this.props.sortedAscendingIcon] = this.props.sorted === 1;
        sortIcon[this.props.sortedDescendingIcon] = this.props.sorted === -1;
        sortIcon[this.props.sortableIcon] = this.props.sorted === 0;

        const {Icon} = this.props;
        const icon = this.props.sortable ? <Icon icon={classSet(sortIcon)}/> : null;

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
    align: 'left',
    alignLeftClass: 'text-left',
    alignRightClass: 'text-right',
    alignCenterClass: 'text-center',
    sortedAscendingIcon: 'icon-caret-up',
    sortedDescendingIcon: 'icon-caret-down',
    sortableIcon: 'icon-sort'
};

export default createComponent(Header, {modules: ['Icon'], styles});