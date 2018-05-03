import React from "react";
import ReactDOM from "react-dom";
import _ from "lodash";
import $ from "jquery";
import classSet from "classnames";
import { app, createComponent } from "webiny-app";
import styles from "../styles.scss?prefix=Webiny_Ui_Modal";

class ModalComponent extends React.Component {
    constructor(props) {
        super(props);
        this.id = _.uniqueId("modal-");

        this.state = {
            animating: false,
            isShown: false,
            isDialogShown: false
        };

        this.modalShowDuration = 500;
        this.modalHideDuration = 250;
        this.backdropShowDuration = 100;
        this.backdropHideDuration = 200;

        this.clickStartedOnBackdrop = false;
        if (!document.querySelector(props.modalContainerTag)) {
            document.body.appendChild(document.createElement(props.modalContainerTag));
        }

        this.modalContainer = document.querySelector(props.modalContainerTag);

        ["show", "hide", "bindHandlers", "unbindHandlers", "animationFinish"].map(m => {
            this[m] = this[m].bind(this);
        });
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

    bindHandlers() {
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
    }

    unbindHandlers() {
        $(this.props.modalContainerTag).off("." + this.id);
    }

    hide() {
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
    }

    show(data = this.props.data || {}) {
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
    }

    animationFinish(isDialogShown) {
        this.setState({ animating: false });
        if (!isDialogShown) {
            this.setState({ isShown: false }, this.props.onHidden);
            this.hideResolve && this.hideResolve();
        }
    }

    renderDialog() {
        if (!this.state.isShown) {
            return null;
        }

        const {
            modules: { Animate },
            styles
        } = this.props;
        const className = classSet(styles.modal, {
            [styles.wide]: this.props.wide,
            [styles.fullScreen]: this.props.fullScreen
        });
        let content = this.props.children;
        if (_.isFunction(content)) {
            content = content.call(this, { dialog: this });
        }

        return (
            <div style={_.merge({}, { display: "block" }, this.props.style)}>
                <Animate
                    trigger={this.state.isDialogShown}
                    show={{ opacity: 0.8, duration: this.backdropShowDuration, ease: "easeIn" }}
                    hide={{ opacity: 0, duration: this.backdropHideDuration, ease: "easeOut" }}
                >
                    <div className={styles.backdrop} style={{ opacity: 0 }} data-role="backdrop" />
                </Animate>
                <div
                    className={className}
                    tabIndex="-1"
                    style={{ display: "block" }}
                    data-role="modal"
                >
                    <Animate
                        trigger={this.state.isDialogShown}
                        onFinish={this.animationFinish}
                        show={{
                            translateY: 50,
                            ease: "spring",
                            duration: this.modalShowDuration,
                            frequency: 50,
                            friction: 300
                        }}
                        hide={{
                            translateY: -100,
                            ease: "easeOut",
                            opacity: 0,
                            duration: this.modalHideDuration
                        }}
                    >
                        <div
                            className={classSet(styles.dialog, styles.show, this.props.className)}
                            style={{ top: -50 }}
                            data-role="dialog"
                        >
                            {React.cloneElement(content, {
                                data: this.state.data,
                                hide: this.hide,
                                animating: this.state.animating
                            })}
                        </div>
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

export default createComponent(ModalComponent, {
    styles,
    modules: ["Animate", { dynamics: () => import("dynamics.js") }]
});
