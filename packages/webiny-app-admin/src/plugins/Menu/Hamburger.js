import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";
import { IconButton } from "webiny-ui/Button";
import { ReactComponent as MenuIcon } from "webiny-app-admin/assets/icons/baseline-menu-24px.svg";
import { toggleMenu } from "./menu.actions";
import Navigation from "./Navigation";

let el = null;
const getElement = () => {
    if (!el) {
        el = document.createElement("div");
        el.id = "navigation-drawer";
        document.body.appendChild(el);
    }

    return el;
};

const Hamburger = ({ toggleMenu }) => {
    return (
        <React.Fragment>
            <IconButton icon={<MenuIcon style={{color:'white'}} />} onClick={() => toggleMenu()} />
            {ReactDOM.createPortal(<Navigation />, getElement())}
        </React.Fragment>
    );
};

export default connect(
    null,
    { toggleMenu }
)(Hamburger);
