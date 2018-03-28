import React from 'react';
import { createComponent } from 'webiny-app';

/**
 * AdminLayout is the main container that will hold all other components.
 * This component is the first one to render in the <body> element.
 */
class AdminLayout extends React.Component {
    render() {
        const { Navigation, Header, Footer } = this.props;

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

export default createComponent(AdminLayout, {
    modules: [{
        Header: 'Skeleton.Header',
        Navigation: 'Skeleton.Navigation',
        Footer: 'Skeleton.Footer'
    }]
});
