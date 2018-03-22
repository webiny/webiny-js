import React from 'react';
import _ from 'lodash';
import { app, createComponent } from 'webiny-client';

class Navigation extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            user: null,
            highlight: null,
            display: window.outerWidth > 768 ? 'desktop' : 'mobile'
        };

        this.checkDisplayInterval = null;
        this.cursors = [];
    }

    componentDidMount() {
        // Navigation is rendered based on user roles so we need to watch for changes
        this.watch('User', user => {
            this.setState({ user });
        });

        this.watch('Navigation', nav => {
            this.setState({ highlight: _.get(nav, 'highlight') });
        });

        this.checkDisplayInterval = setInterval(() => {
            this.setState({ display: window.outerWidth > 768 ? 'desktop' : 'mobile' });
        }, 500);
    }

    componentWillUnmount() {
        clearInterval(this.checkDisplayInterval);

        // Release data cursors
        _.forEach(this.__cursors, cursor => {
            if (cursor && cursor.tree) {
                cursor.release();
            }
        });
        this.__cursors = [];
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(this.state, nextState);
    }

    watch(key, func) {
        let cursor = app.state.select(key);

        cursor.on("update", e => {
            func(e.data.currentData, e.data.previousData, e);
        });

        this.cursors.push(cursor);
        // Execute callback with initial data
        func(cursor.get());
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { Desktop, Mobile } = this.props;
        const props = {
            highlight: this.state.highlight
        };

        if (this.state.display === 'mobile') {
            return <Mobile {...props}/>
        }

        return <Desktop {...props}/>
    }
}

export default createComponent(Navigation, {
    modules: ['Link', {
        Desktop: 'Skeleton.Navigation.Desktop',
        Mobile: 'Skeleton.Navigation.Mobile'
    }]
});
