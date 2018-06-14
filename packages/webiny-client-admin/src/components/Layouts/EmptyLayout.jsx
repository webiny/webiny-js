import React from 'react';
import { inject } from 'webiny-client';

@inject()
class EmptyLayout extends React.Component {
    render() {
        return (
            <div className="master minimized">
                <div className="master-content">
                    <div className="container-fluid">
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}

export default EmptyLayout;
