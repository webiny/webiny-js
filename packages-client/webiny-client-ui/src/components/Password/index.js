import React from 'react';
import _ from 'lodash';
import { createComponent, i18n } from 'webiny-client';

/**
 * @i18n.namespace Webiny.Ui.Password
 */
class Password extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            showPassword: false,
            icon: 'fa-eye',
            msg: i18n('Show content')
        };

        this.togglePassword = this.togglePassword.bind(this);
    }

    togglePassword() {
        if (this.state.showPassword === true) {
            this.setState({
                showPassword: false,
                icon: 'fa-eye',
                msg: i18n('Show content')
            });
        } else {
            this.setState({
                showPassword: true,
                icon: 'fa-eye-slash',
                msg: i18n('Hide content')
            });
        }
    }

    render() {
        const {render, ...props} = this.props;

        if (render) {
            return render.call(this);
        }

        const { Icon, Input, Link } = props;
        props.info = (
            <Link tabIndex="-1" onClick={this.togglePassword}><Icon icon={this.state.icon}/> {this.state.msg}</Link>
        );
        props.type = this.state.showPassword ? 'text' : 'password';

        return (
            <Input {...props}/>
        );
    }
}

Password.defaultProps = {
    defaultValidate: 'password'
};

export default createComponent(Password, { modules: ['Link', 'Icon', 'Input'], formComponent: true });
