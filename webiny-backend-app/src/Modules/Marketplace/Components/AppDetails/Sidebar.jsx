import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './../../Views/styles.css';

/**
 * @i18n.namespace Webiny.Backend.Marketplace.AppDetails.Sidebar
 */
class Sidebar extends Webiny.Ui.View {
}

Sidebar.defaultProps = {
    renderer() {
        const {styles, Link, Icon, Section, app} = this.props;
        return (
            <div className={styles.sidebar}>
                <Section title={this.i18n('Details')}/>

                <ul className={styles.detailsList}>
                    <li>
                        {this.i18n('Version:')}
                        <span>{app.version}</span>
                    </li>

                    {app.localName !== 'Webiny' && (
                        <li>
                            {this.i18n('Installations:')}
                            <span>{app.installations}</span>
                        </li>
                    )}

                    {app.localName !== 'Webiny' && (
                        <li>
                            {this.i18n('Required Webiny version:')}
                            <span>{app.webinyVersion}</span>
                        </li>
                    )}

                    <li>
                        {this.i18n('Repository:')}
                        <span><Link url={app.repository} newTab>{this.i18n('Visit GitHub')}</Link></span>
                    </li>
                    <li>
                        {this.i18n('Tags:')}
                        <div className={styles.tags}>
                            {app.tags.map(tag => <span key={tag}>#{tag}</span>)}
                        </div>
                    </li>
                </ul>
                <div className={styles.reportIssue}>
                    <Link type="default" url={`${app.repository}/issues`} newTab><Icon icon="fa-bug"/>{this.i18n('Report an Issue')}</Link>
                </div>

            </div>
        );
    }
};

export default Webiny.createComponent(Sidebar, {styles, modules: ['Link', 'Icon', 'Section']});