import React from 'react';
import _ from 'lodash';
import { inject } from 'webiny-client';
import filesize from 'filesize';

@inject({ modules: ['List'], tableField: true })
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

export default FileSizeField;