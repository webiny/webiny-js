import React from 'react';
import classSet from "classnames";
import { createComponent } from 'webiny-client';
import styles from '../../styles.css?prefix=Webiny_Ui_Row_Details';

class RowDetails extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const css = classSet(this.props.className, styles.rowDetails);
        return (
            <tr className={css} style={{ display: this.props.expanded ? 'table-row' : 'none' }}>
                <td colSpan={this.props.fieldsCount}>
                    {this.props.expanded ? this.props.children({ data: this.props.data, $this: this }) : null}
                </td>
            </tr>
        );
    }
}

RowDetails.defaultProps = {
    fieldsCount: 0,
    className: null
};

export default createComponent(RowDetails, { styles });