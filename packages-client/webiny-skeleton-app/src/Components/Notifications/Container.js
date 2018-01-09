import {Webiny} from 'webiny-client';
import React from 'react';
import _ from 'lodash';

const types = {};

class NotificationContainer extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.api = new Webiny.Api.Endpoint('/services/webiny/app-notifications');

        this.state = {
            ready: false
        };

        this.bindMethods('markAsRead');
    }

    componentWillMount() {
        super.componentWillMount();
        const {type} = this.props.notification;
        if (!types[type]) {
            return Webiny.importByTag(type).then(modules => {
                const keys = Object.keys(modules);
                types[type] = !keys.length ? this.props.webinyNotification : modules[keys[0]];
                this.setState({ready: true});
            });
        }

        this.setState({ready: true});
    }

    markAsRead() {
        const {notification} = this.props;
        if (notification.read === false) {
            this.api.post(notification.id + '/mark-read').then(apiResponse => {
                if (apiResponse.isError()) {
                    return Webiny.Growl.danger(apiResponse.getError(), 'Mark as read');
                }

                this.props.onMarkedRead();
            });
        }
    }
}

NotificationContainer.defaultProps = {
    onMarkedRead: _.noop,
    renderer() {
        if (!this.state.ready) {
            return null;
        }

        const props = _.omit(this.props, ['renderer']);
        const Notification = types[props.notification.type];

        return (
            <webiny-notification-container onClick={this.markAsRead}>
                <Notification {...props}/>
            </webiny-notification-container>
        );
    }
};

export default Webiny.createComponent(NotificationContainer, {
    modules: [{webinyNotification: 'Webiny/Skeleton/Notifications/Notification'}]
});