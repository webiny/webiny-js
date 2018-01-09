import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Password
 */
class Password extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            showPassword: false,
            icon: 'fa-eye',
            msg: this.i18n('Show content')
        };

        this.bindMethods('togglePassword');
    }

    togglePassword() {
        if (this.state.showPassword === true) {
            this.setState({
                showPassword: false,
                icon: 'fa-eye',
                msg: this.i18n('Show content')
            });
        } else {
            this.setState({
                showPassword: true,
                icon: 'fa-eye-slash',
                msg: this.i18n('Hide content')
            });
        }
    }
}

Password.defaultProps = {
    defaultValidate: 'password',
    renderer() {
        const props = _.omit(this.props, ['renderer']);
        const {Icon, Input, Link} = props;
        props.info = <Link tabIndex="-1" onClick={this.togglePassword}><Icon icon={this.state.icon}/> {this.state.msg}</Link>;
        props.type = this.state.showPassword ? 'text' : 'password';

        return (
            <Input {...props}/>
        );
    }
};

export default Webiny.createComponent(Password, {modules: ['Link', 'Icon', 'Input']});
