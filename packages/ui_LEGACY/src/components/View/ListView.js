import React from 'react';
import { inject, isElementOfType } from 'webiny-app';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import styles from "./styles.module.css";

@inject({ modules: ['Panel'], styles })
class ListView extends React.Component {

    constructor(props) {
        super(props);

        this.parseLayout = this.parseLayout.bind(this);
    }

    parseLayout(children) {
        this.headerComponent = null;
        this.bodyComponent = null;
        this.footerComponent = null;

        if (typeof children !== 'object' || children === null) {
            return children;
        }

        React.Children.map(children, child => {
            if (isElementOfType(child, Header)) {
                this.headerComponent = child;
                return;
            }

            if (isElementOfType(child, Body)) {
                this.bodyComponent = child;
                return;
            }

            if (isElementOfType(child, Footer)) {
                this.footerComponent = child;
            }
        });
    }

    componentWillMount() {
        this.parseLayout(this.props.children);
    }

    componentWillUpdate(nextProps) {
        this.parseLayout(nextProps.children);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }
        const { modules: { Panel }, styles } = this.props;

        return (
            <div>
                {this.headerComponent}
                <div className={styles.viewContent}>
                    <Panel className={styles.panel}>
                        {this.bodyComponent}
                        {this.footerComponent}
                    </Panel>
                </div>
            </div>
        );
    }
}

export default ListView;