import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';

class DownloadLink extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.dialog = null;
        this.state = {
            showDialog: false
        };

        this.bindMethods('getDialog');
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        if (this.dialog) {
            this.getDialog();
        }
    }

    getDialog() {
        const result = this.props.download({download: this.downloader.download, data: this.props.params || null});
        // At this point we do not want to import Modal component to perform the check so we assume it is a Dialog if it is not null
        if (result) {
            this.dialog = result;
            this.setState({showDialog: true});
        }
    }
}

DownloadLink.defaultProps = {
    download: null,
    method: 'GET',
    params: null,
    disabled: false,
    renderer() {
        const {Downloader, Link, ...props} = this.props;
        const downloader = <Downloader ref={downloader => this.downloader = downloader}/>;
        props.onClick = () => {
            if (this.props.disabled) {
                return;
            }
            if (_.isString(this.props.download)) {
                this.downloader.download(this.props.method, this.props.download, this.props.params);
            } else {
                this.getDialog();
            }
        };
        delete props['download'];

        let dialog = null;
        if (this.dialog) {
            dialog = React.cloneElement(this.dialog, {
                onHidden: () => {
                    this.dialog = null;
                    this.setState({showDialog: false});
                },
                onComponentDidMount: dialog => {
                    if (this.state.showDialog && !dialog.isShown()) {
                        dialog.show();
                    }
                }
            });
        }

        return (
            <Link {..._.omit(props, ['renderer'])}>
                {this.props.children}
                {downloader}
                {dialog}
            </Link>
        );
    }
};

export default Webiny.createComponent(DownloadLink, {modules: ['Downloader', 'Link']});