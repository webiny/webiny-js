import React from 'react';
import {Webiny} from 'webiny-client';
import _ from 'lodash';
import './style.scss'
import imgInfinify from './../../../Assets/images/infinity.png';
import Updates from './Components/Updates';

/**
 * @i18n.namespace Webiny.Backend.Dashboard.Dashboard
 */
class Dashboard extends Webiny.Ui.View {
    constructor(props) {
        super(props);

        this.state = {
            user: {}
        };
    }

    componentDidMount() {
        super.componentDidMount();
        this.watch('User', user => {
            this.setState({user});
        });
    }

    getUserName() {
        const user = this.state.user;
        if (_.get(user, 'firstName', '') === '') {
            return null;
        }

        return _.get(user, 'firstName', '');
    }

}

Dashboard.defaultProps = {
    renderer() {

        const {View, Gravatar, Button, Grid, Icon, Link} = this.props;

        return (
            <View.Dashboard>
                <View.Header title={this.i18n('Dashboard')}>
                    <View.Header.Center>
                        <div className="user-welcome">
                            <div className="user-welcome__avatar">
                                <div className="avatar avatar--inline avatar--small">
                                    <span className="avatar-placeholder avatar-placeholder--no-border">
                                        <Gravatar className="avatar img-responsive" hash={this.state.user.gravatar} size="50"/>
                                    </span>
                                </div>
                            </div>
                            <h3 className="user-welcome__message">Hi {this.getUserName()}</h3>
                        </div>
                    </View.Header.Center>
                    <Button onClick={() => Webiny.Router.goToRoute('Me.Account')}>{this.i18n('Manage Account')}</Button>
                </View.Header>

                <View.Body>
                    <Updates/>
                    
                    <Grid.Row>
                        <Grid.Col all={4}>
                            <View.InfoBlock title={this.i18n('GET STARTED')}>
                                <ul>
                                    <li>
                                        <div className="block-list__item-image">
                                            <Icon icon="icon-keys" size="2x"/>
                                        </div>
                                        <a href="https://www.webiny.com/docs/current/guides/components"
                                           className="block-list__item-text" target="_blank">
                                            <strong>{this.i18n('React Components')}</strong>
                                            {this.i18n(' - Learn what they do and how to implement them.')}

                                        </a>
                                    </li>
                                    <li>
                                        <div className="block-list__item-image">
                                            <Icon icon="fa-book " size="2x"/>
                                        </div>
                                        <a href="https://www.webiny.com/hub/tutorials" className="block-list__item-text"
                                           target="_blank">
                                            <strong>{this.i18n('Tutorials')}</strong>
                                            {this.i18n(' - How to setup Webiny and other applications.')}
                                        </a>
                                    </li>
                                    <li>
                                        <div className="block-list__item-image">
                                            <Icon icon="fa-graduation-cap" size="2x"/>
                                        </div>
                                        <a href="https://www.webiny.com/docs/current/reference-manual/environments"
                                           className="block-list__item-text" target="_blank">
                                            <strong>{this.i18n('Reference Manual')}</strong>
                                            {this.i18n(' - The nitty-gritty details of how the internal components work.')}
                                        </a>
                                    </li>
                                </ul>
                            </View.InfoBlock>
                        </Grid.Col>

                        <Grid.Col all={4}>
                            <View.InfoBlock title={this.i18n('THE HUB')}>
                                <div className="text-center dashboard--block--the-hub">
                                    <div className="title-icon">
                                        <img src={imgInfinify} alt="Webiny Infinity"/>
                                    </div>

                                    <h3>{this.i18n('The Hub')}</h3>
                                    <div className="block-list__item-text">
                                        {this.i18n('Ask questions, present your work, start or join a discussion, view or contribute a tutorial.')}
                                    </div>
                                    <br/>
                                    <div className="text-center">
                                        <Link url="https://www.webiny.com/hub" newTab={true} type="primary">{this.i18n('JOIN')}</Link>
                                    </div>
                                </div>
                            </View.InfoBlock>
                        </Grid.Col>

                        <Grid.Col all={4}>
                            <View.InfoBlock title={this.i18n('SOCIALIZE')}>
                                <div>
                                    <ul>
                                        <li>
                                            <div className="block-list__item-image">
                                                <span className="icon icon-github icon-3x"/>
                                            </div>
                                            <a href="https://github.com/Webiny/Webiny" className="block-list__item-text" target="_blank">
                                                <Icon icon="fa-github"/> {this.i18n('GitHub')}
                                            </a>
                                        </li>
                                        <li>
                                            <div className="block-list__item-image">
                                                <span className="icon icon-twitter icon-3x"/>
                                            </div>
                                            <a href="https://twitter.com/WebinyPlatform" className="block-list__item-text" target="_blank">
                                                <Icon icon="fa-twitter"/> {this.i18n('Twitter')}
                                            </a>
                                        </li>
                                        <li>
                                            <div className="block-list__item-image">
                                                <span className="icon icon-medium icon-3x"/>
                                            </div>
                                            <a href="https://blog.webiny.com"
                                               className="block-list__item-text" target="_blank">
                                                <Icon icon="fa-medium"/> {this.i18n('Blog')}
                                            </a>
                                        </li>

                                        <li>
                                            <div className="block-list__item-image">
                                                <span className="icon icon-youtube icon-3x"/>
                                            </div>
                                            <a href="https://video.webiny.com"
                                               className="block-list__item-text" target="_blank">
                                                <Icon icon="fa-youtube"/> {this.i18n('YouTube')}
                                            </a>
                                        </li>

                                        <li>
                                            <div className="block-list__item-image">
                                                <span className="icon icon-youtube icon-3x"/>
                                            </div>
                                            <a href="https://chat.webiny.com"
                                               className="block-list__item-text" target="_blank">
                                                <Icon icon="fa-commenting-o"/> {this.i18n('Chat')}
                                            </a>
                                        </li>

                                    </ul>
                                </div>
                            </View.InfoBlock>
                        </Grid.Col>

                    </Grid.Row>

                </View.Body>

            </View.Dashboard>
        );
    }
};

export default Webiny.createComponent(Dashboard, {
    modules: ['View', 'Gravatar', 'Button', 'Grid', 'Icon', 'Link']
});