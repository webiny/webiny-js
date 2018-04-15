import React from "react";
import { createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";

class EditorWidget extends React.Component {
    render() {
        const { modules: { Form }, value } = this.props;
        return (
            <Form model={value.data} onChange={this.props.onChange}>
                {this.props.children}
            </Form>
        );
    }
}

export default createComponent([EditorWidget, FormComponent], {
    modules: ["Form"]
});
