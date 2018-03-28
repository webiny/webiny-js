import React from 'react';
import _ from 'lodash';
import { createComponent } from 'webiny-app';

class ModalAction extends React.Component {
    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        if (_.isFunction(this.props.hide) && this.props.hide(this.props.data)) {
            return null;
        }

        const { Icon, Link, Downloader } = this.props;

        const download = (httpMethod, url, params = null) => {
            this.downloader.download(httpMethod, url, params);
            this.dialog.hide();
        };

        const modal = this.props.children.call(this, {
            data: this.props.data,
            actions: this.props.actions,
            download,
            dialog: {
                hide: () => {
                    if (this.dialog) {
                        return this.dialog.hide();
                    }
                    return Promise.resolve(true);
                }
            }
        });

        const icon = this.props.icon ? <Icon icon={this.props.icon}/> : null;

        return (
            <Link onClick={() => this.dialog.show()}>
                {icon}
                {this.props.label}
                {React.cloneElement(modal, { onReady: dialog => this.dialog = dialog })}
                <Downloader ref={ref => this.downloader = ref}/>
            </Link>
        );
    }
}

ModalAction.defaultProps = {
    data: null,
    actions: null,
    hide: _.noop,
    download: false
};

export default createComponent(ModalAction, { modules: ['Icon', 'Link', 'Downloader'] });