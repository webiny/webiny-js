import React from "react";
import { createComponent } from "webiny-app";

class ParagraphWidget extends React.Component {
    render() {
        const { value } = this.props;
        return <p>{value.data.text}</p>;
    }
}

export default createComponent(ParagraphWidget);
