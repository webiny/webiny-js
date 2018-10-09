import React from "react";
import { compose, lifecycle} from "recompose";
import WebFont from "webfontloader";
import { ThemeContextProvider } from "./ThemeContext";

const Theme = ({ theme, children }) => {
    return <ThemeContextProvider theme={theme}>{children}</ThemeContextProvider>
};

export default compose(
    lifecycle({
        componentDidMount(){
            WebFont.load(this.props.theme.fonts);
        }
    })
)(Theme);