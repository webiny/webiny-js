import React from 'react';
import _ from 'lodash';
import { inject } from 'webiny-client';
import classSet from "classnames";
import styles from "../../../styles.module.css";

@inject({ modules: ['Link', 'List'], tableField: true, styles })
class RowDetailsField extends React.Component {
    render() {
        const { modules: { Link, List }, styles, render, ...tdProps } = this.props;

        if (render) {
            return render.call(this);
        }

        let onClick = this.props.actions.hideRowDetails;
        let className = classSet(styles.expand, styles.close);
        if (!this.props.rowDetailsExpanded) {
            onClick = this.props.actions.showRowDetails;
            className = styles.expand;
        }

        const props = {
            onClick: onClick(this.props.rowIndex),
            className
        };

        let content = <Link {...props}/>;
        if (_.isFunction(this.props.hide) ? this.props.hide(this.props.data) : this.props.hide) {
            content = null;
        }

        return (
            <List.Table.Field {...tdProps} className={styles.rowDetailsField}>
                {() => content}
            </List.Table.Field>
        );
    }
}

RowDetailsField.defaultProps = {
    hide: false
};

export default RowDetailsField;