import React from 'react';
import {Webiny} from 'webiny-client';
import Header from './Header';
import HeaderLeft from './DashboardComponents/HeaderLeft';
import HeaderCenter from './DashboardComponents/HeaderCenter';
import HeaderRight from './DashboardComponents/HeaderRight';
import Body from './Body';
import styles from './styles.css';

class DashboardView extends Webiny.Ui.Component {

    constructor(props) {
        super(props);

        this.bindMethods('parseLayout');
    }

    parseLayout(children) {
        this.headerLeft = null;
        this.headerCenter = null;
        this.headerRight = [];
        this.bodyComponent = null;
        this.footerComponent = null;

        if (typeof children !== 'object' || children === null) {
            return children;
        }

        React.Children.map(children, child => {
            if (Webiny.isElementOfType(child, Header)) {
                this.headerLeft = <HeaderLeft title={child.props.title} description={child.props.description}/>;

                React.Children.map(child.props.children, subChild => {
                    if (Webiny.isElementOfType(subChild, HeaderCenter)) {
                        this.headerCenter = <HeaderCenter {...subChild.props}/>;
                    } else {
                        this.headerRight.push(subChild);
                    }
                });

                return;
            }

            if (Webiny.isElementOfType(child, Body)) {
                this.bodyComponent = child.props.children;
                return;
            }
        });

        if (this.headerRight.length > 0) {
            this.headerRight = <HeaderRight children={this.headerRight}/>
        } else {
            this.headerRight = null;
        }
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

DashboardView.defaultProps = {
    renderer() {

        const {styles} = this.props;

        return (
            <view className={styles.dashboard}>
                <div className={styles.viewHeader}>
                    {this.headerLeft}
                    {this.headerCenter}
                    {this.headerRight}
                </div>

                <div className={styles.content}>
                    {this.bodyComponent}
                </div>
            </view>
        );
    }
};

export default Webiny.createComponent(DashboardView, {styles});