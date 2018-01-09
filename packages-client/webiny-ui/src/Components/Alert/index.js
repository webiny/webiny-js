import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import AlertContainer from './Container';
import styles from './styles.css';

class Alert extends Webiny.Ui.Component {

}

Alert.defaultProps = {
    type: 'info',
    icon: null,
    title: null,
    close: false,
    onClose: _.noop,
    className: null,
    renderer({props}) {
        const {styles, type, Icon, onClose} = props;

        const typeClasses = {
            info: styles.alertInfo,
            success: styles.alertSuccess,
            warning: styles.alertWarning,
            error: styles.alertDanger,
            danger: styles.alertDanger
        };

        const iconClasses = {
            info: 'icon-info-circle',
            success: 'icon-check-circle-o',
            warning: 'icon-exclamation-circle',
            error: 'icon-cancel',
            danger: 'icon-cancel'
        };

        const classes = this.classSet(
            typeClasses[type],
            props.className
        );


        let icon = null;
        if (this.props.icon) {
            icon = <Icon icon={this.props.icon}/>;
        } else {
            icon = <Icon icon={iconClasses[type]}/>;
        }

        const title = props.title ? <strong>{props.title}:</strong> : null;

        return (
            <AlertContainer onClose={onClose}>
                {close => (
                    <div className={classes}>
                        {icon}
                        {props.close && (
                            <button type="button" className={styles.close} onClick={close}>
                                <span aria-hidden="true">×</span>
                            </button>
                        )}
                        {title} {props.children}
                    </div>
                )}
            </AlertContainer>
        );
    }
};

export default Webiny.createComponent(Alert, {styles, modules: ['Icon']});