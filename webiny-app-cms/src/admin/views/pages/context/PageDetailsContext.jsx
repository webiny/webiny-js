import React from "react";
import { PageManagerConsumer } from "./PageManagerContext";

const PageDetailsContext = React.createContext();

export class PageDetailsProvider extends React.Component {
    render() {
        return (
            <PageManagerConsumer>
                {value => (
                    <PageDetailsContext.Provider value={{...value, ...this.props.value}}>
                        {this.props.children}
                    </PageDetailsContext.Provider>
                )}
            </PageManagerConsumer>
        );
    }
}

export class PageDetailsConsumer extends React.Component {
    render() {
        return <PageDetailsContext.Consumer>{this.props.children}</PageDetailsContext.Consumer>;
    }
}
