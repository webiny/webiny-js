import React from 'react';
import _ from 'lodash';
import classSet from "classnames";
import { app, Component } from 'webiny-client';
import TabHeader from './TabHeader';
import TabContent from './TabContent';
import styles from './styles.css?prefix=wui-tabs';

@Component({ styles, tabs: true })
class Tabs extends React.Component {
    constructor() {
        super();
        this.state = {
            selected: 0
        };

        this.tabs = [];
        this.tabsHeader = [];
        this.tabsContent = [];

        [
            'parseChildren',
            'selectTab',
            'getSelectedTab'
        ].map(m => this[m] = this[m].bind(this));
    }

    selectTab(index) {
        this.setState({ selected: index });
    }

    getSelectedTab() {
        return this.state.selected;
    }

    componentWillMount() {
        this.setState({ selected: app.router.getParams('tab') || this.props.selected || 0 });
    }

    componentDidMount() {
        this.props.onReady && this.props.onReady({
            selectTab: this.selectTab,
            getSelectedTab: this.getSelectedTab
        });
    }

    componentWillUnmount() {
        if (this.props.detachFromForm) {
            this.props.detachFromForm(this);
        }
    }

    componentWillReceiveProps(props) {
        // Tabs selected via props
        if (props.selected !== this.props.selected) {
            this.setState({ selected: props.selected });
        }
    }

    parseChildren(props, state) {
        this.tabsHeader = [];
        this.tabsContent = [];

        React.Children.map(props.children, (child, index) => {
            const active = parseInt(state.selected) === index;

            const headerProps = {
                key: index,
                active
            };

            _.assign(headerProps, _.omit(child.props, ['render', 'children', 'renderContent', 'renderHeader']));

            let tabClicked = (e) => {
                e.persist();
                // Pass instance of Tabs, index clicked and event.
                child.props.onClick({ tabs: this, index, e});
                if (!e.isDefaultPrevented()) {
                    this.selectTab(index);
                }
            };

            if (_.has(child.props, 'renderHeader')) {
                headerProps.render = child.props.renderHeader;
            }

            this.tabsHeader.push(
                <TabHeader {...headerProps} stretch={this.props.stretch} onClick={tabClicked}/>
            );

            const contentProps = {
                key: index,
                active
            };
            _.assign(contentProps, _.omit(child.props, ['render', 'renderContent', 'renderHeader']));
            if (_.has(child.props, 'renderContent')) {
                contentProps.render = child.props.renderContent;
            }
            this.tabsContent.push(
                <TabContent {...contentProps}/>
            );
        });
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        this.parseChildren(this.props, this.state);
        return this.props.renderTabs.call(this);
    }
}

Tabs.defaultProps = {
    position: 'top', // top, left
    size: 'default',
    stretch: false,
    selected: 0,
    renderTabs() {
        const { styles, position } = this.props;

        const tabsContainerCss = classSet(
            styles.tabs,
            {
                [styles.navigationTop]: position === 'top',
                [styles.navigationLeft]: position === 'left'
            }
        );

        const tabsNavClasses = {
            [styles.navigation]: true,
            [styles.navigationLarge]: this.props.size === 'large'
        };

        return (
            <div className={tabsContainerCss}>
                <div className={styles.body}>
                    <ul className={classSet(tabsNavClasses)}>
                        {this.props.renderHeader.call(this, { header: this.tabsHeader })}
                    </ul>
                    <div className={styles.panes}>
                        {this.props.renderContent.call(this, { content: this.tabsContent })}
                    </div>
                </div>
            </div>
        );
    },
    renderHeader({ header }) {
        return header;
    },
    renderContent({ content }) {
        return content;
    }
};

export default Tabs;