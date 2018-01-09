import {Webiny} from 'webiny-client';
import React from 'react';
import NotificationModal from './NotificationModal';

class WebinyNotification extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.bindMethods('onClick');
    }

    onClick() {
        this.dialog.show();
    }
}

WebinyNotification.defaultProps = {
    icon: 'icon-exclamation-circle',
    renderer() {
        const {Filters, Label, notification, icon} = this.props;
        return (
            <div onClick={this.onClick} className="notification-block">
                <span className={icon + ' ' + 'icon' + (notification.read ? ' read' : '')}></span>
                <span>
                    {/*!notification.read && (
                        <Label type="success">New</Label>
                    )*/}
                </span>
                <div className="drop-txt">
                    <a href="#">{notification.subject}</a>
                    <span className="content">{notification.text}</span>
                    <span className="timestamp"><Filters.TimeAgo className="test" value={notification.createdOn}/></span>
                </div>
                <NotificationModal notification={notification} ref={ref => this.dialog = ref}/>
            </div>
        );
    }
};

export default Webiny.createComponent(WebinyNotification, {modules: ['Filters', 'Label']});