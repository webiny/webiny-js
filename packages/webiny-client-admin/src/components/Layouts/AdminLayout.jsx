import React from 'react';
import { Component } from 'webiny-client';

/**
 * AdminLayout is the main container that will hold all other components.
 * This component is the first one to render in the <body> element.
 */
@Component({
    modules: [{
        Header: 'Admin.Header',
        Navigation: 'Admin.Navigation',
        Footer: 'Admin.Footer'
    }]
})
class AdminLayout extends React.Component {
    render() {
        const { Navigation, Header, Footer } = this.props.modules;

        return (
            <div className="master minimized">
                <Header/>
                <Navigation/>
                <div className="master-content">
                    <div className="container-fluid">
                        {this.props.children}
                    </div>
                </div>
                <Footer/>
            </div>
        );
    }
}

export default AdminLayout;
