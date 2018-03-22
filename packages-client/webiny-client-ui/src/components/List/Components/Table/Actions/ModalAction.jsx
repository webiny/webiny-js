import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class ModalAction extends Webiny.Ui.Component {
}

ModalAction.defaultProps = {
    data: null,
    actions: null,
    hide: _.noop,
    download: false,
    renderer() {
        if (_.isFunction(this.props.hide) && this.props.hide(this.props.data)) {
            return null;
        }

        const {Icon, Link, Downloader} = this.props;

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
                {React.cloneElement(modal, {ref: ref => this.dialog = ref})}
                <Downloader ref={ref => this.downloader = ref}/>
            </Link>
        );
    }
};

export default Webiny.createComponent(ModalAction, {modules: ['Icon', 'Link', 'Downloader']});