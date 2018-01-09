import React from 'react';
import {Webiny} from 'webiny-client';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import styles from './styles.css';

class ListView extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.bindMethods('parseLayout');
    }

    parseLayout(children) {
        this.headerComponent = null;
        this.bodyComponent = null;
        this.footerComponent = null;

        if (typeof children !== 'object' || children === null) {
            return children;
        }

        React.Children.map(children, child => {
            if (Webiny.isElementOfType(child, Header)) {
                this.headerComponent = child;
                return;
            }

            if (Webiny.isElementOfType(child, Body)) {
                this.bodyComponent = child;
                return;
            }

            if (Webiny.isElementOfType(child, Footer)) {
                this.footerComponent = child;
            }
        });
    }

    componentWillMount() {
        super.componentWillMount();
        this.parseLayout(this.props.children);
    }

    componentWillUpdate(nextProps, nextState) {
        super.componentWillUpdate(nextProps, nextState);
        this.parseLayout(nextProps.children);
    }
}

ListView.defaultProps = {
    renderer() {
        const {Panel, styles} = this.props;

        return (
            <view>
                {this.headerComponent}
                <div className={styles.viewContent}>
                    <Panel className={styles.panel}>
                        {this.bodyComponent}
                        {this.footerComponent}
                    </Panel>
                </div>
            </view>
        );
    }
};

export default Webiny.createComponent(ListView, {modules: ['Panel'], styles});