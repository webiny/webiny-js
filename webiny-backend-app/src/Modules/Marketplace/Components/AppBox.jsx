import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../Views/styles.css';

/**
 * @i18n.namespace Webiny.Backend.Marketplace.AppBox
 */
class AppBox extends Webiny.Ui.View {
}

AppBox.defaultProps = {
    renderer() {
        const {styles, Link, app} = this.props;

        return (
            <div className={styles.appBox}>
                <div className={styles.logo}>
                    <img src={app.logo.src}/>
                </div>
                <h3>{app.name.toUpperCase()}</h3>

                <p className={styles.shortDescription}>{app.shortDescription}</p>
                <Link route="Marketplace.AppDetails" type="default" params={{id: app.id}} className={styles.viewDetails}>
                    {this.i18n('view details')}
                </Link>
                {app.installedVersion && (<div className={styles.footer}>
                    <p>{this.i18n('Installed version: {version}', {version: <strong>{app.installedVersion}</strong>})}</p>
                </div>)}
            </div>
        );
    }
};

export default Webiny.createComponent(AppBox, {styles, modules: ['Link']});