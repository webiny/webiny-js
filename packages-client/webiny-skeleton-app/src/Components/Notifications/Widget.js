import React from 'react';
import {Webiny} from 'webiny-client';

class NotificationsWidget extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.state = {
            notifications: [],
            unread: 0,
            viewMore: 0
        };

        this.api = new Webiny.Api.Endpoint(props.api);

        this.bindMethods('loadNotifications');
    }

    componentWillMount() {
        super.componentWillMount();

        this.interval = setInterval(() => this.loadNotifications(), this.props.interval);
        this.loadNotifications()
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        clearInterval(this.interval);
        this.request && this.request.cancel();
    }

    loadNotifications() {
        if (this.request) {
            return this.request;
        }

        this.request = this.api.get('/', {_perPage: this.props.visibleNotifications}).then(apiResponse => {
            if (apiResponse.isError()) {
                return Webiny.Growl.danger(apiResponse.getError(), 'Could not fetch notifications');
            }

            const data = apiResponse.getData();

            this.setState({
                notifications: data.list,
                unread: data.meta.unread,
                viewMore: data.meta.totalCount - 3
            });
        }).then(() => {
            this.request = null;
        });
    }

    markAllRead() {
        this.api.post('mark-read').then(apiResponse => {
            if (apiResponse.isError()) {
                return Webiny.Growl.danger(apiResponse.getError(), 'Mark all as read');
            }

            this.loadNotifications();
        });
    }

}

NotificationsWidget.defaultProps = {
    api: '/services/webiny/app-notifications',
    interval: 60000, // 60 seconds
    visibleNotifications: 4,
    renderer() {
        const {Link, Icon, Container} = this.props;
        return (
            <div className="notification-holder">
                {this.state.unread > 0 && <span className="num" data-toggle="dropdown">{this.state.unread}</span>}
                <a href="#" className="notification" data-toggle="dropdown">
                    <span className="icon-bell icon"/>
                </a>

                <div className="drop dropdown-menu" data-role="dropdown-menu" role="menu">
                    <span className="top-arr"/>
                    <ul>
                        {!this.state.notifications.length && (
                            <li>
                                <span><Icon icon="fa-coffee"/> Relax and have a sip of coffee!</span>
                            </li>
                        )}
                        {this.state.notifications.map(n => (
                            <li key={n.id}>
                                <Container notification={n} onMarkedRead={() => this.loadNotifications()}/>
                            </li>
                        ))}
                    </ul>
                    <div className="drop-footer">
                        <Link className="read" onClick={() => this.markAllRead()}><span className="icon-check icon"/>Mark all as read</Link>
                        <Link route="Me.Notifications" className="settings"><span className="fa fa-search"/>View all</Link>
                    </div>
                </div>
            </div>
        );
    }
};

export default Webiny.createComponent(NotificationsWidget, {
    modules: ['Link', 'Icon', {Container: 'Webiny/Skeleton/Notifications/Container'}]
});