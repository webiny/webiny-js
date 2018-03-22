import React from 'react';
import _ from 'lodash';
import AnimationSets from './AnimationSets';
import { TransitionGroup } from 'react-transition-group';

/**
 * Only componentWillEnter and componentWillLeave can be used because they way ModalDialog component mounts into DOM.
 */
class Container extends React.Component {
    constructor(props) {
        super(props);
        this.state = { shown: false };
        this.dom = null;
        this.hideAction = this.hideAction.bind(this);
        this.showAction = this.showAction.bind(this);
    }

    componentWillEnter(callback) {
        this.showAction(callback);
    }

    componentWillLeave(callback) {
        this.hideAction(callback);
    }

    hideAction(callback) {
        if (!this.state.shown) {
            //callback();
            return;
        }
        this.setState({ shown: false });

        const elements = this.dom.childNodes;

        const hideCallback = () => {
            try {
                callback();
            } catch (e) {
                // ignore
            }

            if (_.isFunction(this.props.onFinish)) {
                this.props.onFinish();
            }
        };

        _.forEach(elements, (el) => {
            if (_.isObject(this.props.hide)) {
                AnimationSets.custom(this.props.hide, el, hideCallback);
            } else {
                AnimationSets[this.props.hide](el, hideCallback);
            }
        });
    }

    showAction(callback) {
        if (this.state.shown) {
            return;
        }
        this.setState({ shown: true });

        const elements = this.dom.childNodes;

        const showCallback = () => {
            callback();
            if (_.isFunction(this.props.onFinish)) {
                this.props.onFinish(true);
            }
        };

        _.forEach(elements, (el) => {
            if (_.isObject(this.props.show)) {
                AnimationSets.custom(this.props.show, el, () => {
                    try {
                        callback();
                    } catch (e) {
                        // ignore
                    }
                    if (_.isFunction(this.props.onFinish)) {
                        this.props.onFinish(true);
                    }
                });
            } else {
                AnimationSets[this.props.show](el, showCallback);
            }
        });
    }

    render() {
        return <div ref={ref => this.dom = ref} className={this.props.className}>{this.props.children}</div>;
    }
}


class Animate extends React.Component {
    firstChild(props) {
        const childrenArray = React.Children.toArray(props.children);
        return childrenArray[0].type || 'span';
    }

    render() {
        return (
            <TransitionGroup component={this.firstChild(this.props)}>
                {(this.props.trigger === true) && (
                    <Container
                        onFinish={this.props.onFinish}
                        show={this.props.show}
                        hide={this.props.hide}
                        className={this.props.className}>
                        {this.props.children}
                    </Container>
                )}
            </TransitionGroup>
        );
    }
}

Animate.defaultProps = {
    trigger: false,
    onFinish: _.noop,
    show: 'fadeIn',
    hide: 'fadeOut'
};


export default Animate;