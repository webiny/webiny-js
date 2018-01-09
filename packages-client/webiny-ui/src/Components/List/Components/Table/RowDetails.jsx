import React from 'react';
import {Webiny} from 'webiny-client';
import styles from '../../styles.css';

class RowDetails extends Webiny.Ui.Component {

}

RowDetails.defaultProps = {
    fieldsCount: 0,
    className: null,
    renderer() {
        const css = this.classSet(this.props.className, styles.rowDetails);
        return (
            <tr className={css} style={{display: this.props.expanded ? 'table-row' : 'none'}}>
                <td colSpan={this.props.fieldsCount}>
                    {this.props.expanded ? this.props.children({data: this.props.data, $this: this}) : null}
                </td>
            </tr>
        );
    }
};

export default Webiny.createComponent(RowDetails, {styles});