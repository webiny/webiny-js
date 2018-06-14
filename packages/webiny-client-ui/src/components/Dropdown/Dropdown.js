import React from "react";
import _ from "lodash";
import $ from "jquery";
import classSet from "classnames";
import { Component } from "webiny-client";
import styles from "./styles.scss?prefix=wui-dropdown";

@Component({ styles })
class Dropdown extends React.Component {
    constructor(props) {
        super(props);
        this.id = _.uniqueId("dropdown-");
    }

    componentDidMount() {
        if (!this.props.closeOnClick) {
            $(document).on("click." + this.id, "." + this.id + " .dropdown-menu", e => {
                e.stopPropagation();
            });
        }

        const { styles } = this.props;

        $(this.element).on({
            "show.bs.dropdown": () => {
                this.props.onShow();
                $(this.element).addClass(styles.opened);
            },
            "shown.bs.dropdown": () => {
                this.props.onShown();
            },
            "hide.bs.dropdown": () => {
                this.props.onHide();
                $(this.element).removeClass(styles.opened);
            },
            "hidden.bs.dropdown": () => {
                this.props.onHidden();
            }
        });
    }

    componentWillUnmount() {
        $(document).off("." + this.id);
    }

    close() {
        const { styles } = this.props;
        $(this.element).removeClass("open");
        $(this.element).removeClass(styles.opened);
    }

    render() {
        if (this.props.render) {
            return this.props.render.call(this);
        }

        const { styles, ...props } = this.props;

        const alignClasses = {
            normal: "",
            left: "pull-left",
            right: "pull-right"
        };

        const classes = classSet(
            styles.dropdown,
            alignClasses[props.align],
            props.className,
            this.id,
            this.props.type === "balloon" && styles.balloon,
            props.maxWidth && styles.maxWidth
        );

        const buttonClasses = classSet("dropdown-toggle", styles.dropdownToggle);

        return (
            <div className={classes} data-role="dropdown" ref={ref => (this.element = ref)}>
                <button
                    className={buttonClasses}
                    type="button"
                    data-toggle="dropdown"
                    disabled={this.props.disabled}
                >
                    {props.title}
                    {props.caret && <span className={"caret " + styles.caret} />}
                </button>
                <ul
                    className={"dropdown-menu " + styles.dropdownMenu}
                    role="menu"
                    style={this.props.listStyle}
                    data-role="dropdown-menu"
                >
                    {_.isFunction(props.children)
                        ? props.children.call(this, this)
                        : props.children}
                </ul>
            </div>
        );
    }
}

Dropdown.defaultProps = {
    align: "normal",
    caret: true,
    closeOnClick: true,
    disabled: false,
    listStyle: null,
    className: null,
    maxWidth: false,
    onShow: _.noop,
    onShown: _.noop,
    onHide: _.noop,
    onHidden: _.noop,
    type: "default"
};

export default Dropdown;
