import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import styles from './styles.css';
import Required from './Components/Required';
import Label from './Components/Label';
import InfoMessage from './Components/InfoMessage';
import ValidationIcon from './Components/ValidationIcon';
import ValidationMessage from './Components/ValidationMessage';
import DescriptionMessage from './Components/DescriptionMessage';

class FormGroup extends Webiny.Ui.Component {

}

FormGroup.defaultProps = {
    renderer() {
        const cssConfig = this.classSet(
            styles.wrapper,
            this.props.className,
            (this.props.valid === false && styles.error),
            (this.props.valid === true && styles.success)
        );

        return (<div className={cssConfig}>
            <div className={styles.inputGroup}>
                {this.props.children}
            </div>
        </div>);
    }
};

_.assign(FormGroup, {
    Label,
    Required,
    InfoMessage,
    ValidationIcon,
    ValidationMessage,
    DescriptionMessage
});

export default Webiny.createComponent(FormGroup, {styles});