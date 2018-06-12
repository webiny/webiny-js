import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-client';
import filesize from 'filesize';

class FileSizeField extends React.Component {
    render() {
        const { modules: { List }, render, options, ...props } = this.props;
        if (render) {
            return render.call(this);
        }

        return (
            <List.Table.Field {...props}>
                {() => filesize(_.get(this.props.data, this.props.name), options)}
            </List.Table.Field>
        );
    }
}

FileSizeField.defaultProps = {
    options: {}
};

export default createComponent(FileSizeField, { modules: ['List'], tableField: true });