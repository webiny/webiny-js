import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from '../../../styles.css';

class SelectRowField extends Webiny.Ui.Component {

}

SelectRowField.defaultProps = {
    headerRenderer() {
        return (
            <th>
                <Webiny.Ui.LazyLoad modules={['Checkbox']}>
                    {({Checkbox}) => (
                        <Checkbox value={this.props.allRowsSelected} onChange={this.props.onSelectAll} className={styles.selectRow}/>
                    )}
                </Webiny.Ui.LazyLoad>
            </th>
        );
    },
    renderer() {
        const {rowSelected, rowDisabled, onSelect, Checkbox, List, ...props} = this.props;
        return (
            <List.Table.Field {..._.omit(props, ['renderer'])} className="row-details">
                {() => <Checkbox disabled={rowDisabled} value={rowSelected} onChange={onSelect} className={styles.selectRow}/>}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(SelectRowField, {modules: ['Checkbox', 'List'], styles, tableField: true});