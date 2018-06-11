import React, { Fragment } from "react";
import { createComponent } from "webiny-app";
import PageContent from "./PageEditor/PageContent";
import Header from "./PageEditor/Header";

class PageEditor extends React.Component {
    render() {
        const { Form, FormData, FormError, Loader } = this.props.modules;

        return (
            <FormData
                withRouter
                entity={"CmsRevision"}
                defaultModel={{ content: [] }}
                fields={"id name active title slug content { id type data }"}
            >
                {({ model, submit, error, loading }) => (
                    <Form model={model} onSubmit={submit} onChange={model => console.log(model)}>
                        {({ submit, model, Bind }) => (
                            <Fragment>
                                {loading && <Loader />}
                                {error && <FormError error={error} />}
                                <Header page={model} onSave={submit} Bind={Bind} />
                                <Bind>
                                    <PageContent page={model} name={"content"} />
                                </Bind>
                            </Fragment>
                        )}
                    </Form>
                )}
            </FormData>
        );
    }
}

export default createComponent(PageEditor, {
    modules: [
        "List",
        "Input",
        "Select",
        "Grid",
        "Modal",
        "Loader",
        "Tabs",
        "Form",
        "FormData",
        "FormError",
        "Button"
    ]
});
