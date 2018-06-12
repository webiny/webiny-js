import React from 'react';
import {Webiny} from 'webiny-client';
const Ui = Webiny.Ui.Components;

class Download extends Webiny.Ui.Component {
    constructor(props) {
        super(props);

        this.hasDialog = false;
        this.state = {
            showDialog: false
        };

        this.bindMethods('elementDownload,download');
    }

    elementDownload(...params) {
        if (this.hasDialog) {
            return this.setState({showDialog: true});
        }

        return this.download(...params);
    }

    download(...params) {
        return this.refs.downloader.download(...params);
    }

}

Download.defaultProps = {
    renderer() {
        return (
            <webiny-download>
                {React.Children.map(this.props.children, child => {
                    const props = {};
                    if (Webiny.isElementOfType(child, Ui.Download.Element)) {
                        props.download = this.elementDownload;
                    }

                    if (Webiny.isElementOfType(child, Ui.Download.Dialog)) {
                        this.hasDialog = true;
                        props.download = this.download;
                        props.show = this.state.showDialog;
                        props.onHidden = () => this.setState({showDialog: false});
                    }
                    return React.cloneElement(child, props);
                })}
                <Ui.Downloader ref="downloader"/>
            </webiny-download>
        );
    }
};

export default Download;