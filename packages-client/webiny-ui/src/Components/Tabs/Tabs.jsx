import React from 'react';
import _ from 'lodash';
import {Webiny} from 'webiny-client';
import TabHeader from './TabHeader';
import TabContent from './TabContent';
import styles from './styles.css';

class Tabs extends Webiny.Ui.Component {

    constructor() {
        super();
        this.state = {
            selected: 0
        };

        this.tabs = [];
        this.tabsHeader = [];
        this.tabsContent = [];

        this.bindMethods('parseChildren,selectTab,renderTabs,renderHeader,renderContent');
    }

    selectTab(index) {
        this.setState({selected: index});
    }

    getSelectedTab() {
        return this.state.selected;
    }

    componentWillMount() {
        super.componentWillMount();
        this.setState({selected: Webiny.Router.getParams('tab') || this.props.selected || 0});
        if (this.props.attachToForm) {
            this.props.attachToForm(this);
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        if (this.props.detachFromForm) {
            this.props.detachFromForm(this);
        }
    }

    componentWillReceiveProps(props) {
        super.componentWillReceiveProps(props);
        // Tabs selected via props
        if (props.selected !== this.props.selected) {
            this.setState({selected: props.selected});
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

            _.assign(headerProps, _.omit(child.props, ['renderer', 'children', 'contentRenderer', 'headerRenderer']));

            let tabClicked = (e) => {
                // Pass instance of Tabs, index clicked and event.
                child.props.onClick(this, index, e);
                if (!e.isDefaultPrevented()) {
                    this.selectTab(index);
                }
            };

            if (_.has(child.props, 'headerRenderer')) {
                headerProps.renderer = child.props.headerRenderer;
            }

            this.tabsHeader.push(
                <TabHeader {...headerProps} onClick={tabClicked}/>
            );

            const contentProps = {
                key: index,
                active
            };
            _.assign(contentProps, _.omit(child.props, ['renderer', 'contentRenderer', 'headerRenderer']));
            if (_.has(child.props, 'contentRenderer')) {
                contentProps.renderer = child.props.contentRenderer;
            }
            this.tabsContent.push(
                <TabContent {...contentProps}/>
            );
        });
    }

    renderTabs() {
        return this.props.tabsRenderer.call(this);
    }

    renderHeader() {
        return this.props.headerRenderer.call(this, {header: this.tabsHeader});
    }

    renderContent() {
        return this.props.contentRenderer.call(this, {content: this.tabsContent});
    }
}

Tabs.defaultProps = {
    position: 'top', // top, left
    size: 'default',
    selected: 0,
    tabsRenderer() {
        const {styles} = this.props;

        const tabsContainerCss = this.classSet(
            styles.tabs,
            {
                [styles.navigationTop]: this.props.position === 'top',
                [styles.navigationLeft]: this.props.position === 'left'
            }
        );

        const tabsNavClasses = {
            [styles.navigation]: true,
            [styles.navigationLarge]: this.props.size === 'large'
        };

        return (
            <div className={tabsContainerCss}>
                <div className={styles.body}>
                    <ul className={this.classSet(tabsNavClasses)}>{this.renderHeader()}</ul>
                    <div className={styles.panes}>{this.renderContent()}</div>
                </div>
            </div>
        );
    },
    headerRenderer({header}) {
        return header;
    },
    contentRenderer({content}) {
        return content;
    },
    renderer() {
        this.parseChildren(this.props, this.state);
        return this.renderTabs();
    }
};

export default Webiny.createComponent(Tabs, {styles, tabs: true, api: ['selectTab', 'getSelectedTab']});