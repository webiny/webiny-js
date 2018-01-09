import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import $ from 'jquery';
import {Webiny} from 'webiny-client';
import Header from './Header';
import Footer from './Footer';
import Body from './Body';
import styles from '../styles.css';

const mountedDialogs = [];

function getShownDialog(id = null) {
    return _.find(mountedDialogs, item => item.state.isShown === true && item.id !== id);
}

class Dialog extends Webiny.Ui.Component {

    constructor(props) {
        super(props);
        this.id = _.uniqueId('modal-');

        this.state = {
            isShown: false,
            isDialogShown: false
        };

        this.modalShowDuration = 500;
        this.modalHideDuration = 250;
        this.backdropShowDuration = 100;
        this.backdropHideDuration = 200;

        this.animating = false;
        this.clickStartedOnBackdrop = false;
        if (!document.querySelector(props.modalContainerTag)) {
            document.body.appendChild(document.createElement(props.modalContainerTag));
        }

        this.modalContainer = document.querySelector(props.modalContainerTag);

        this.bindMethods('show,hide,isAnimating,bindHandlers,unbindHandlers,prepareChildren,prepareChild,animationFinish');
    }

    componentWillUpdate(nextProps, nextState) {
        super.componentWillUpdate(nextProps, nextState);
        const currentDialog = getShownDialog();
        const {dynamics} = this.props;

        // Hide currently visible dialog but do not unmount it
        if (currentDialog && currentDialog.id !== this.id && nextState.isShown) {
            const container = $(currentDialog.modalContainer);
            const dialog = container.find('[data-role="dialog"]');
            const backdrop = container.find('[data-role="backdrop"]');

            dynamics.animate(dialog[0], {
                opacity: 0,
                translateY: -100
            }, {
                type: dynamics.easeOut,
                duration: this.modalHideDuration,
                complete: () => {
                    // Need to hide .modal to let mouse events through
                    dialog.closest('[data-role="modal"]').hide();
                    // Remove transform so next time we animate, we start from scratch, with no transformations applied
                    dialog.css('transform', '');
                }
            });

            dynamics.animate(backdrop[0], {
                opacity: 0
            }, {
                type: dynamics.easeOut,
                duration: this.backdropHideDuration
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        super.componentDidUpdate(prevProps, prevState);
        if (this.isShown()) {
            ReactDOM.render(this.props.renderDialog.call(this), this.modalContainer);
            $(this.modalContainer).find('[data-role="modal"]').focus();
            this.bindHandlers();
        } else if (prevState.isShown && !this.isShown()) {
            this.unbindHandlers();
            ReactDOM.unmountComponentAtNode(this.modalContainer);
        }
    }

    componentDidMount() {
        super.componentDidMount();
        mountedDialogs.push(this);
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.unbindHandlers();
        mountedDialogs.splice(_.findIndex(mountedDialogs, {id: this.id}), 1);
        ReactDOM.unmountComponentAtNode(this.modalContainer);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
    }

    bindHandlers() {
        this.unbindHandlers();
        const namespace = '.' + this.id;
        $(this.props.modalContainerTag).on('keyup' + namespace, '[data-role="modal"]', e => {
            // Listen for ESC button
            if (e.keyCode === 27 && !this.animating && this.props.closeOnClick) {
                Promise.resolve(this.props.onCancel()).then(this.hide);
            }
        }).on('mousedown' + namespace, '[data-role="modal"]', e => {
            // Catch backdrop click
            if ($(e.target).attr('data-role') === 'modal') {
                this.clickStartedOnBackdrop = true;
            }
        }).on('click' + namespace, '[data-role="modal"]', () => {
            if (this.clickStartedOnBackdrop && this.props.closeOnClick) {
                Promise.resolve(this.props.onCancel()).then(this.hide);
            }
            this.clickStartedOnBackdrop = false;
        });
    }

    unbindHandlers() {
        $(this.props.modalContainerTag).off('.' + this.id);
    }

    hide() {
        if (!this.state.isDialogShown || this.animating) {
            return Promise.resolve(true);
        }

        this.animating = true;
        return Promise.resolve(this.props.onHide()).then(() => {
            return new Promise(resolve => {
                this.hideResolve = resolve;
                this.setState({
                    isDialogShown: false
                });
            });
        });
    }

    show() {
        // This shows the modal container element in case it was previously hidden by another dialog
        this.props.onShow();

        if (this.isShown()) {
            // Animate previously hidden dialog
            return new Promise(resolve => {
                const {dynamics} = this.props;
                this.animating = true;
                const prevContainer = $(this.modalContainer);
                const prevDialog = prevContainer.find('[data-role="dialog"]');
                const prevBackdrop = prevContainer.find('[data-role="backdrop"]');
                prevDialog.closest('[data-role="modal"]').show();
                dynamics.animate(prevDialog[0], {
                    opacity: 1,
                    translateY: 50
                }, {
                    type: dynamics.spring,
                    duration: this.modalShowDuration,
                    complete: () => {
                        prevDialog.closest('[data-role="modal"]').focus();
                        this.animating = false;
                        resolve();
                    }
                });

                dynamics.animate(prevBackdrop[0], {
                    opacity: 0.8
                }, {
                    type: dynamics.easeIn,
                    duration: this.backdropShowDuration
                });
            });
        }

        return new Promise(resolve => {
            // If showing previously visually hidden modal - resolve promise
            if (this.isShown()) {
                return resolve();
            }

            this.setState({
                isShown: true
            }, () => {
                // Now we are supposed to show dialog with animation
                this.animating = true;
                const show = () => {
                    this.setState({
                        isDialogShown: true
                    }, () => {
                        this.props.onShown();
                        resolve();
                    });
                };

                // If there was a previous dialog (eg: hidden with ClickConfirm), let the animation finish and show new dialog with delay
                if (getShownDialog(this.id)) {
                    setTimeout(show, 250);
                } else {
                    // No previous dialog was opened - we can safely show our new dialog
                    show();
                }
            });
        });
    }

    isShown() {
        return this.state.isShown;
    }

    isAnimating() {
        return this.animating;
    }

    prepareChild(child) {
        if (typeof child !== 'object' || child === null) {
            return child;
        }

        if (_.find([Header, Body, Footer], c => Webiny.isElementOfType(child, c))) {
            const props = {dialog: this};
            if (Webiny.isElementOfType(child, Header) && child.props.onClose === _.noop) {
                props['onClose'] = this.hide;
            }
            return React.cloneElement(child, props);
        }

        if (child.props.children) {
            return React.cloneElement(child, _.omit(child.props, ['ref', 'key']), this.prepareChildren(child.props.children));
        }
        return child;
    }

    prepareChildren(children) {
        if (typeof children !== 'object' || children === null) {
            return children;
        }
        return React.Children.map(children, this.prepareChild);
    }

    animationFinish(isDialogShown) {
        this.animating = false;
        if (!isDialogShown) {
            this.setState({isShown: false}, this.props.onHidden);
            this.hideResolve && this.hideResolve();
        }
    }
}

Dialog.defaultProps = {
    wide: false,
    fullScreen: false,
    onHide: _.noop,
    onHidden: _.noop,
    onShow: _.noop,
    onShown: _.noop,
    onCancel: _.noop, // Called when dialog is closed using ESC or backdrop click
    closeOnClick: true,
    modalContainerTag: 'webiny-modal',
    style: {},
    renderDialog() {
        const {Animate, styles} = this.props;
        const className = this.classSet(styles.modal, {[styles.wide]: this.props.wide, [styles.fullScreen]: this.props.fullScreen});
        let content = this.props.children;
        if (_.isFunction(content)) {
            content = content.call(this, {dialog: this});
        }

        return (
            <div style={_.merge({}, {display: 'block'}, this.props.style)}>
                <Animate
                    trigger={this.state.isDialogShown}
                    show={{opacity: 0.8, duration: this.backdropShowDuration, ease: 'easeIn'}}
                    hide={{opacity: 0, duration: this.backdropHideDuration, ease: 'easeOut'}}>
                    <div className={styles.backdrop} style={{opacity: 0}} data-role="backdrop"/>
                </Animate>
                <div className={className} tabIndex="-1" style={{display: 'block'}} data-role="modal">
                    <Animate
                        trigger={this.state.isDialogShown}
                        onFinish={this.animationFinish}
                        show={{translateY: 50, ease: 'spring', duration: this.modalShowDuration, frequency: 50, friction: 300}}
                        hide={{translateY: -100, ease: 'easeOut', opacity: 0, duration: this.modalHideDuration}}>
                        <div className={this.classSet(styles.dialog, styles.show, this.props.className)} style={{top: -50}}
                             data-role="dialog">
                            {this.prepareChildren(content)}
                        </div>
                    </Animate>
                </div>
            </div>
        );
    },
    renderer() {
        return null;
    }
};

export default Webiny.createComponent(Dialog, {
    styles,
    modules: ['Animate', {dynamics: () => import('dynamics.js')}],
    api: ['show', 'hide', 'isShown', 'isAnimating']
});