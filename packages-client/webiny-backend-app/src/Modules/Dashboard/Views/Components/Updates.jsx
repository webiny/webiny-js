import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';

/**
 * @i18n.namespace Webiny.Backend.Dashboard
 */
class Updates extends Webiny.Ui.View {
    constructor(props) {
        super(props);

        this.state = {
            updates: [],
            loaded: false,
            dismissing: false,
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.getUpdates();
    }

    getUpdates() {
        // check local storage
        let updates = Webiny.LocalStorage.get('dashboardUpdates');
        if (updates) {
            let lastUpdate = new Date() - new Date(Webiny.LocalStorage.get('dashboardLastUpdate'));
            if (lastUpdate < 86400000) { // 24h
                this.setState({updates: updates, loaded: true});
                return;
            }
        }

        // refresh dashboard updates
        return new Webiny.Api.Endpoint('/entities/webiny/dashboard-updates').get('/latest').then(apiResponse => {
            const updates = apiResponse.getData('list');
            if (updates && updates.length > 0) {
                this.setState({updates: updates, loaded: true, dismissing: false});
            } else {
                this.setState({updates: [], loaded: true, dismissing: false});
            }

            // store dashboard updates and the last update time
            Webiny.LocalStorage.set('dashboardUpdates', updates);
            Webiny.LocalStorage.set('dashboardLastUpdate', new Date());
        });
    }

    dismissUpdate(id) {
        this.setState({dismissing: true});
        return new Webiny.Api.Endpoint('/entities/webiny/dashboard-updates').get('/' + id + '/dismiss').then(apiResponse => {
            // remove local storage entries
            Webiny.LocalStorage.remove('dashboardUpdates');
            Webiny.LocalStorage.remove('dashboardLastUpdate');

            // call the getUpdates function to refresh the dashboard list
            this.getUpdates();
        });
    }
}

Updates.defaultProps = {
    renderer() {

        const {Grid, Loader, Carousel, Link, Icon, View} = this.props;

        if (!this.state.loaded) {
            return (<Loader><span>{this.i18n('Loading your updates...')}</span></Loader>);
        }

        if (this.state.updates.length < 1) {
            return (
                <Grid.Row>
                    <Grid.Col all={12}>
                    </Grid.Col>
                </Grid.Row>
            );
        }

        return (

            <div className="block block--slider">

                <div className="block-header">
                    <h4 className="block-title-light pull-left">{this.i18n('Updates from webiny.com')}</h4>
                </div>

                <div className="block-content block-content--dynamic-height">
                    <div className="slider">
                        <div className="slides">
                            {this.state.dismissing && <Loader><span>{this.i18n('Loading your updates...')}</span></Loader>}

                            <Carousel items={1} dots={true}>
                                {_.get(this.state, 'updates') && this.state.updates.map(post => {
                                    let link = "https://www.webiny.com/r/" + post.refId;
                                    return (
                                        <div className="slide slide--active" key={post.id}>
                                            {post.image && (
                                                <div className="slide__image">
                                                    <img src={post.image}/>
                                                </div>
                                            )}
                                            <div className="slide__content">
                                                <div className="slide__title">
                                                    {post.hasLink === true ?
                                                        <a href={link} target="_blank">{post.title}</a> : post.title}
                                                </div>
                                                <div className="slide__excerpt">{post.content}</div>
                                            </div>
                                            <div className="slide__button">
                                                {post.hasLink && (<Link type="primary" url={link} newTab={true}>{this.i18n('Learn more')}</Link>)}
                                                <br/>
                                                <Link className="dismiss" onClick={() => {
                                                    this.dismissUpdate(post.id)
                                                }}>{this.i18n('Dismiss')}</Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </Carousel>

                        </div>

                    </div>
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(Updates, {
    modules: ['Grid', 'Loader', 'Carousel', 'Link', 'Icon']
});