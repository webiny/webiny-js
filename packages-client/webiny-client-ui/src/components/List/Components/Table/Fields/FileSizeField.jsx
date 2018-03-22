import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import filesize from 'filesize';

class FileSizeField extends Webiny.Ui.Component {

}

FileSizeField.defaultProps = {
    options: {},
    renderer() {
        const {List, ...props} = this.props;
        return (
            <List.Table.Field {..._.omit(props, ['renderer', 'options'])}>
                {() => filesize(_.get(this.props.data, this.props.name), this.props.options)}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(FileSizeField, {modules: ['List'], tableField: true});