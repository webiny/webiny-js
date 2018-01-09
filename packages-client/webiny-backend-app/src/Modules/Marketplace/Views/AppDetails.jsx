import React from 'react';
import {Webiny} from 'webiny-client';
import styles from './styles.css';
import './draft.scss';
import InstallModal from '../Components/InstallModal';
import UpdateModal from '../Components/UpdateModal';
import UpdateSuccessModal from '../Components/UpdateSuccessModal';
import Sidebar from '../Components/AppDetails/Sidebar';
import Carousel from '../Components/AppDetails/Carousel';
import ContentBlock from '../Components/AppDetails/ContentBlock';

/**
 * @i18n.namespace Webiny.Backend.Marketplace.AppDetails
 */
class AppDetails extends Webiny.Ui.View {
    constructor(props) {
        super(props);

        this.bindMethods('renderCTA');
    }

    componentWillMount() {
        super.componentWillMount();
        this.setState({loading: true});
        const id = Webiny.Router.getParams('id');
        new Webiny.Api.Endpoint('/services/webiny/marketplace').get(`apps/${id}`).then(apiResponse => {
            this.setState({loading: false, app: apiResponse.getData('entity')});
        });
    }

    renderCTA() {
        const {app} = this.state;
        const {Button} = this.props;

        if (!app.updateAvailable || !app.webinyVersionOk) {
            return null;
        }

        if (app.installedVersion) {
            return (
                <Button type="primary" icon="fa-download" label={`Update`} onClick={() => this.updateModal.show()}/>
            );
        }

        return (
            <Button type="secondary" icon="fa-download" label={this.i18n('Install')} onClick={() => this.installModal.show()}/>
        );
    }
}

AppDetails.defaultProps = {
    renderer() {
        const {loading, app} = this.state;
        const {styles, Link, View, Grid, Button, Tabs, Loader, Alert} = this.props;

        if (loading) {
            return <Loader>{this.i18n('Fetching app details...')}</Loader>;
        }

        return (
            <div className={styles.appDetails}>
                {!app.webinyVersionOk && (
                    <Alert type="warning">
                        {this.i18n(`This app requires Webiny {appWebinyVersion}. Your current Webiny is {currentVersion}.`, {
                            appWebinyVersion: <strong>{app.webinyVersion}</strong>,
                            currentVersion: <strong>{app.installedWebinyVersion}</strong>
                        })}
                        <br/>
                        {this.i18n('Please update Webiny before attempting to install this app.')}
                    </Alert>
                )}
                <div className={styles.header}>
                    <div className={styles.title}>
                        <img src={app.logo.src} className={styles.logo}/>
                        <div className={styles.titleBlock}>
                            <h2>{app.name}</h2>
                            <p>{app.shortDescription}</p>
                        </div>
                    </div>
                    <div className={styles.action}>
                        {this.renderCTA()}
                        <InstallModal ref={ref => this.installModal = ref} app={app}/>
                        <UpdateModal ref={ref => this.updateModal = ref} app={app} onUpdated={() => this.updateSuccessModal.show()}/>
                        <UpdateSuccessModal ref={ref => this.updateSuccessModal = ref} app={app}/>
                        {/*<span onClick={() => this.updateSuccessModal.show()}>ShowSuccess</span>*/}
                    </div>
                </div>
                <Tabs>
                    <Tabs.Tab label={this.i18n('Details')} icon="fa-home">
                        <Grid.Row>
                            <Grid.Col all={8}>
                                <Carousel images={app.images.map(a => a.src)}/>
                                <ContentBlock title={this.i18n('About')} content={app.longDescription}/>
                            </Grid.Col>
                            <Grid.Col all={4}>
                                <Sidebar app={app}/>
                            </Grid.Col>
                        </Grid.Row>
                    </Tabs.Tab>
                    <Tabs.Tab label={this.i18n('Installation')} icon="fa-hdd-o">
                        <Grid.Row>
                            <Grid.Col all={8}>
                                <ContentBlock title={this.i18n('Installation')} content={app.readme}/>
                            </Grid.Col>
                            <Grid.Col all={4}>
                                <Sidebar app={app}/>
                            </Grid.Col>
                        </Grid.Row>
                    </Tabs.Tab>
                    <Tabs.Tab label={this.i18n('Change Log')} icon="fa-pencil">
                        <Grid.Row>
                            <Grid.Col all={8}>
                                <ContentBlock title={this.i18n('Change log')} content={app.changeLog}/>
                            </Grid.Col>
                            <Grid.Col all={4}>
                                <Sidebar app={app}/>
                            </Grid.Col>
                        </Grid.Row>
                    </Tabs.Tab>
                </Tabs>
            </div>
        );
    }
};

export default Webiny.createComponent(AppDetails, {
    styles,
    modules: ['View', 'Link', 'Gravatar', 'Grid', 'Button', 'Tabs', 'Loader', 'Alert']
});