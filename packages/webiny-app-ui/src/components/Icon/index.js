import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-app';
import classSet from "classnames";
import styles from "./styles.css";

class Icon extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, icon, className, element, onClick } = this.props;
        let iconSet = 'icon';
        if (_.includes(icon, 'fa-')) {
            iconSet = 'fa icon';
        }

        const typeClasses = {
            default: '',
            danger: styles.danger,
            success: styles.success,
            info: styles.info,
            warning: styles.warning,
        };

        const sizeClasses = {
            default: '',
            '2x': styles.size2x,
            '3x': styles.size3x,
            '4x': styles.size4x
        };

        const classes = classSet(iconSet, icon, className, sizeClasses[this.props.size], typeClasses[this.props.type]);

        return React.createElement(element, { className: classes, onClick });
    }
}

Icon.defaultProps = {
    icon: null,
    className: null,
    element: 'span', // span || i
    type: 'default',
    size: 'default'
};

export default createComponent(Icon, { styles });