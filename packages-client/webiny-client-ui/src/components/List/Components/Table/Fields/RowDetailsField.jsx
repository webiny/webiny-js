import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from '../../../styles.css';

class RowDetailsField extends Webiny.Ui.Component {

}

RowDetailsField.defaultProps = {
    hide: false,
    renderer() {
        const {styles} = this.props;

        let onClick = this.props.actions.hideRowDetails;
        let className = this.classSet(styles.expand, styles.close);
        if (!this.props.rowDetailsExpanded) {
            onClick = this.props.actions.showRowDetails;
            className = styles.expand;
        }

        const props = {
            onClick: onClick(this.props.rowIndex),
            className
        };

        const {Link, List, ...tdProps} = this.props;
        let content = <Link {...props}/>;
        if (_.isFunction(this.props.hide) ? this.props.hide(this.props.data) : this.props.hide) {
            content = null;
        }

        return (
            <List.Table.Field {..._.omit(tdProps, ['renderer'])} className={styles.rowDetailsField}>
                {() => content}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(RowDetailsField, {modules: ['Link', 'List'], tableField: true, styles});