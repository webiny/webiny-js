import React from "react";
import { Component } from "webiny-client";
import logo from "./../assets/images/logo.png";

@Component()
class Logo extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            display: "desktop"
        };
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
        const { className, href, img, altText } = this.props;

        let style = {
            width: this.props.width,
            height: this.props.height
        };

        if (this.state.display !== "desktop") {
            style.width = this.props.mobileWidth;
            style.height = this.props.mobileHeight;
        }

        return (
            <a href={href} className={className}>
                <img src={img} style={style} alt={altText} />
            </a>
        );
    }
}

Logo.defaultProps = {
    className: "logo",
    img: logo,
    width: 100,
    height: 32,
    mobileWidth: 62,
    mobileHeight: 20,
    altText: "Webiny",
    href: "#"
};

export default Logo;
