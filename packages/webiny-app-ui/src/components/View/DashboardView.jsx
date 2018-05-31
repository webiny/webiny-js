import React from 'react';
import { isElementOfType, createComponent } from 'webiny-app';
import Header from './Header';
import HeaderLeft from './DashboardComponents/HeaderLeft';
import HeaderCenter from './DashboardComponents/HeaderCenter';
import HeaderRight from './DashboardComponents/HeaderRight';
import Body from './Body';
import styles from './styles.css?prefix=wui-view';

class DashboardView extends React.Component {

    constructor(props) {
        super(props);

        this.parseLayout = this.parseLayout.bind(this);
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
            if (isElementOfType(child, Header)) {
                this.headerLeft = <HeaderLeft title={child.props.title} description={child.props.description}/>;

                React.Children.map(child.props.children, subChild => {
                    if (isElementOfType(subChild, HeaderCenter)) {
                        this.headerCenter = <HeaderCenter {...subChild.props}/>;
                    } else {
                        this.headerRight.push(subChild);
                    }
                });

                return;
            }

            if (isElementOfType(child, Body)) {
                this.bodyComponent = child.props.children;
            }
        });

        if (this.headerRight.length > 0) {
            this.headerRight = <HeaderRight children={this.headerRight}/>
        } else {
            this.headerRight = null;
        }
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

        const { styles } = this.props;

        return (
            <div className={styles.dashboard}>
                <div className={styles.viewHeader}>
                    {this.headerLeft}
                    {this.headerCenter}
                    {this.headerRight}
                </div>

                <div className={styles.content}>
                    {this.bodyComponent}
                </div>
            </div>
        );
    }
}

export default createComponent(DashboardView, { styles });