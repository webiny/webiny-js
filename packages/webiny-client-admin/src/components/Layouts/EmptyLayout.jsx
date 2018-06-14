import React from 'react';
import { Component } from 'webiny-client';

@Component()
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
