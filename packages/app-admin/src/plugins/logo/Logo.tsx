import React from "react";
import { isEqual } from "lodash";
import { ReactComponent as WebinyLogo } from "@webiny/app-admin/assets/images/webiny-logo.svg";
import { Link } from "@webiny/react-router";

class Logo extends React.Component<any> {
    static defaultProps = {
        width: 100,
        height: 30,
        mobileWidth: 100,
        mobileHeight: 36,
        altText: "Webiny",
        className: "",
        white: false
    };

    checkDisplayInterval = null;

    state = { display: "desktop" };

    shouldComponentUpdate(props, state) {
        return !isEqual(state, this.state);
    }

    componentDidMount() {
        this.checkDisplayInterval = setInterval(() => {
            this.setState({ display: window.outerWidth > 768 ? "desktop" : "mobile" });
        }, 500);
    }

    componentWillUnmount() {
        clearInterval(this.checkDisplayInterval);
    }

    render() {
        const { className, altText, white } = this.props;

        const style = {
            width: this.props.width,
            height: this.props.height,
            display: this.props.display,
            marginTop: 12,
            color: undefined
        };

        if (white) {
            style.color = "white";
        }

        if (this.state.display !== "desktop") {
            style.width = this.props.mobileWidth;
            style.height = this.props.mobileHeight;
        }

        return (
            <Link to={"/"}>
                <WebinyLogo
                    className={["webiny-logo", className].join(" ")}
                    style={style}
                    alt={altText}
                />
            </Link>
        );
    }
}

export default Logo;
