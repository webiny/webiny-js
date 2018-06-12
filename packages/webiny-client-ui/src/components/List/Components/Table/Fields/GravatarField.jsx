import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-client';

class GravatarField extends React.Component {
    render() {
        const { modules: { Gravatar, List }, size, render, ...props } = this.props;

        if (render) {
            return render.call(this);
        }

        return (
            <List.Table.Field {...props}>
                {() => <Gravatar hash={_.get(this.props.data, this.props.name)} size={size}/>}
            </List.Table.Field>
        );
    }
}

GravatarField.defaultProps = {
    size: 48
};

export default createComponent(GravatarField, { modules: ['Gravatar', 'List'], tableField: true });