import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';

class InfoBlock extends Webiny.Ui.Component {

}

InfoBlock.defaultProps = {
    title: '',
    description: '',
    className: '',
    renderer() {

        let showHeader = false;
        if (this.props.title !== '' || this.props.description !== '') {
            showHeader = true;
        }

        return (
            <div className={this.classSet(styles.infoBlock, this.props.className)}>
                {showHeader && (<div className={styles.header}>
                    <h4 className={styles.title}>{this.props.title}</h4>
                    <div className={styles.titleLight}>{this.props.description}</div>
                </div>)}
                <div className={styles.container}>
                    {this.props.children}
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(InfoBlock, {styles});