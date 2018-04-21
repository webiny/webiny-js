import React from "react";
import { createComponent } from "webiny-app";

class ParagraphWidget extends React.Component {
    render() {
        const { modules: { Textarea }, Bind } = this.props;
        return (
            <React.Fragment>
                <Bind>
                    <Textarea name={"text"} />
                </Bind>
            </React.Fragment>
        );
    }
}

export default createComponent(ParagraphWidget, { modules: ["Textarea"] });
