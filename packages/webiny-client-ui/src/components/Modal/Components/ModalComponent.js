import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import $ from "jquery";
import classSet from "classnames";
import { app, inject } from "webiny-client";
import styles from "../styles.scss?prefix=wui-modal";

@inject({
    styles,
    modules: ["Animate"]
})
class ModalComponent extends React.Component {
    constructor(props) {
        super(props);
        this.id = _.uniqueId("modal-");

        this.state = {
            animating: false,
            isShown: false,
            isDialogShown: false
        };

        this.modalShowDuration = 400;
        this.modalHideDuration = 250;
        this.backdropShowDuration = 100;
        this.backdropHideDuration = 200;

        this.clickStartedOnBackdrop = false;
        if (!document.querySelector(props.modalContainerTag)) {
            document.body.appendChild(document.createElement(props.modalContainerTag));
        }

        this.modalContainer = document.querySelector(props.modalContainerTag);
    }

    componentWillMount() {
        app.services.get("modal").register(this.props.name || this.id, this);
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.state.isShown) {
            ReactDOM.render(this.renderDialog(), this.modalContainer);
            $(this.modalContainer)
                .find('[data-role="modal"]')
                .focus();
            this.bindHandlers();
        } else if (prevState.isShown && !this.state.isShown) {
            this.unbindHandlers();
            ReactDOM.unmountComponentAtNode(this.modalContainer);
        }
    }

    componentDidMount() {
        this.props.onReady &&
            this.props.onReady({
                show: this.show,
                hide: this.hide
            });
    }

    componentWillUnmount() {
        this.unbindHandlers();
        ReactDOM.unmountComponentAtNode(this.modalContainer);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return !_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state);
    }

    bindHandlers = () => {
        this.unbindHandlers();
        const namespace = "." + this.id;
        $(this.props.modalContainerTag)
            .on("keyup" + namespace, '[data-role="modal"]', e => {
                // Listen for ESC button
                if (e.keyCode === 27 && !this.state.animating && this.props.closeOnClick) {
                    Promise.resolve(this.props.onCancel()).then(this.hide);
                }
            })
            .on("mousedown" + namespace, '[data-role="modal"]', e => {
                // Catch backdrop click
                if ($(e.target).attr("data-role") === "modal") {
                    this.clickStartedOnBackdrop = true;
                }
            })
            .on("click" + namespace, '[data-role="modal"]', () => {
                if (this.clickStartedOnBackdrop && this.props.closeOnClick) {
                    Promise.resolve(this.props.onCancel()).then(this.hide);
                }
                this.clickStartedOnBackdrop = false;
            });
    };

    unbindHandlers = () => {
        $(this.props.modalContainerTag).off("." + this.id);
    };

    hide = () => {
        if (!this.state.isDialogShown || this.state.animating) {
            return Promise.resolve(true);
        }

        this.setState({ animating: true });
        return Promise.resolve(this.props.onHide()).then(() => {
            return new Promise(resolve => {
                this.hideResolve = resolve;
                this.setState({
                    isDialogShown: false
                });
            });
        });
    };

    show = (data = this.props.data || {}) => {
        // This shows the modal container element in case it was previously hidden by another dialog
        this.props.onShow();

        return new Promise(resolve => {
            this.setState({ data, isShown: true }, () => {
                // Now we are supposed to show dialog with animation
                this.setState({ animating: true });
                setTimeout(() => {
                    this.setState({ isDialogShown: true }, () => {
                        this.props.onShown();
                        resolve();
                    });
                });
            });
        });
    };

    onEntered = () => {
        this.setState({ animating: false });
    };

    onExited = () => {
        this.setState({ animating: false, isShown: false }, this.props.onHidden);
        this.hideResolve && this.hideResolve();
    };

    renderDialog() {
        if (!this.state.isShown) {
            return null;
        }

        const {
            modules: { Animate },
            styles,
            children
        } = this.props;

        const className = classSet(styles.modal, {
            [styles.wide]: this.props.wide,
            [styles.fullScreen]: this.props.fullScreen
        });

        return (
            <div style={_.merge({}, { display: "block" }, this.props.style)}>
                <Animate
                    trigger={this.state.isDialogShown}
                    enterAnimation={{
                        opacity: 0.8,
                        duration: this.backdropShowDuration,
                        type: "easeIn"
                    }}
                    exitAnimation={{
                        opacity: 0,
                        duration: this.backdropHideDuration,
                        type: "easeOut"
                    }}
                >
                    {({ ref }) => (
                        <div
                            ref={ref}
                            className={styles.backdrop}
                            style={{ opacity: 0 }}
                            data-role="backdrop"
                        />
                    )}
                </Animate>
                <div
                    className={className}
                    tabIndex="-1"
                    style={{ display: "block" }}
                    data-role="modal"
                >
                    <Animate
                        trigger={this.state.isDialogShown}
                        onEntered={this.onEntered}
                        onExited={this.onExited}
                        enterAnimation={{
                            translateY: 50,
                            type: "spring",
                            duration: this.modalShowDuration,
                            frequency: 50,
                            friction: 300
                        }}
                        exitAnimation={{
                            translateY: -100,
                            type: "easeOut",
                            opacity: 0,
                            duration: this.modalHideDuration
                        }}
                    >
                        {({ ref }) => (
                            <div
                                ref={ref}
                                className={classSet(
                                    styles.dialog,
                                    styles.show,
                                    this.props.className
                                )}
                                style={{ top: -50 }}
                                data-role="dialog"
                            >
                                {children.call(this, {
                                    dialog: this,
                                    data: this.state.data,
                                    hide: this.hide,
                                    animating: this.state.animating
                                })}
                            </div>
                        )}
                    </Animate>
                </div>
            </div>
        );
    }

    render() {
        return null;
    }
}

ModalComponent.defaultProps = {
    wide: false,
    fullScreen: false,
    onHide: _.noop,
    onHidden: _.noop,
    onShow: _.noop,
    onShown: _.noop,
    onCancel: _.noop, // Called when dialog is closed using ESC or backdrop click
    onReady: _.noop,
    closeOnClick: true,
    modalContainerTag: "webiny-modal",
    style: {}
};

export default ModalComponent;
