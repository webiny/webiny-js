import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class GravatarField extends Webiny.Ui.Component {

}

GravatarField.defaultProps = {
    size: 48,
    renderer() {
        const {Gravatar, List, size, ...props} = this.props;
        return (
            <List.Table.Field {..._.omit(props, ['renderer'])}>
                {() => <Gravatar hash={_.get(this.props.data, this.props.name)} size={size}/>}
            </List.Table.Field>
        );
    }
};

export default Webiny.createComponent(GravatarField, {modules: ['Gravatar', 'List'], tableField: true});