import React from "react";

const PageManagerContext = React.createContext();

export class PageManagerProvider extends React.Component {
    render() {
        return (
            <PageManagerContext.Provider value={this.props.value}>
                {this.props.children}
            </PageManagerContext.Provider>
        );
    }
}

export class PageManagerConsumer extends React.Component {
    render() {
        return (
            <PageManagerContext.Consumer>
                {this.props.children}
            </PageManagerContext.Consumer>
        );
    }
}
