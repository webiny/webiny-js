import React from "react";
import { createComponent } from "webiny-app";
import { FormComponent } from "webiny-app-ui";

class EditorWidget extends React.Component {
    render() {
        const { modules: { Form }, value, onChange } = this.props;
        return (
            <Form model={value.data} onChange={onChange}>
                {this.props.children}
            </Form>
        );
    }
}

export default createComponent([EditorWidget, FormComponent], {
    modules: ["Form"]
});
