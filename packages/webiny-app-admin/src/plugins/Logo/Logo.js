// @flow
import React from "react";
import { ReactComponent as WebinyLogo } from "webiny-app-admin/assets/images/webiny-logo.svg";

class Logo extends React.Component {
    static defaultProps = {
        width: 100,
        height: 30,
        mobileWidth: 100,
        mobileHeight: 36,
        altText: "Webiny",
        className: ""
    };

    checkDisplayInterval = null;

    state = { display: "desktop" };

    componentDidMount() {
        this.checkDisplayInterval = setInterval(() => {
            this.setState({ display: window.outerWidth > 768 ? "desktop" : "mobile" });
        }, 500);
    }

    componentWillUnmount() {
        clearInterval(this.checkDisplayInterval);
    }

    render() {
        const { className, altText } = this.props;

        let style = {
            width: this.props.width,
            height: this.props.height,
            display: this.props.display,
            marginTop: 12
        };

        if (this.state.display !== "desktop") {
            style.width = this.props.mobileWidth;
            style.height = this.props.mobileHeight;
        }

        return (
            <WebinyLogo className={["webiny-logo", className].join(" ")} style={style} alt={altText} />
        );
    }
}

export default Logo;
