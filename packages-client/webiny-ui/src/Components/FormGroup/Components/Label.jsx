import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../styles.css';

class Label extends Webiny.Ui.Component {

}

Label.defaultProps = {
    tooltip: null,
    renderer() {
        let tooltip = null;
        if (this.props.tooltip) {
            tooltip = (
                <Webiny.Ui.LazyLoad modules={['Tooltip', 'Icon']}>
                    {({Tooltip, Icon}) => (
                        <Tooltip key="label" target={<Icon icon="icon-info-circle"/>}>{this.props.tooltip}</Tooltip>
                    )}
                </Webiny.Ui.LazyLoad>
            );
        }
        return <label className={styles.label}>{this.props.children} {tooltip}</label>;
    }
};

export default Webiny.createComponent(Label);