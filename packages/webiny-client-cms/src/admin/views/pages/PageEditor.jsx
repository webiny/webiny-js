import React from "react";
import { app, Component } from "webiny-client";
import PageContent from "./PageEditor/PageContent";
import Header from "./PageEditor/Header";
import { PageEditorProvider } from "../../utils/context/pageEditorContext";

@Component({
    modules: ["Loader", "Form", "FormData", "FormError"]
})
export default class PageEditor extends React.Component {
    state = {
        widgetPresets: []
    };

    async componentDidMount() {
        // Load widgetPresets
        const listWidgetPresets = app.graphql.generateList("CmsWidgetPreset");
        listWidgetPresets({
            fields: "id type title data",
            variables: { sort: "title", perPage: 1000 }
        }).then(({ data }) => {
            this.setState({ widgetPresets: data.list });
        });
    }

    createPreset = async (title, type, data) => {
        const create = app.graphql.generateCreate("CmsWidgetPreset", "id");

        await create({ variables: { data: { title, type, data } } });
    };

    getEditorProviderValue = revision => {
        return {
            revision,
            widgetPresets: this.state.widgetPresets,
            createPreset: this.createPreset
        };
    };

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
                            <PageEditorProvider value={this.getEditorProviderValue(model)}>
                                {loading && <Loader />}
                                {error && <FormError error={error} />}
                                <Header page={model} onSave={submit} Bind={Bind} />
                                <Bind>
                                    <PageContent page={model} name={"content"} />
                                </Bind>
                            </PageEditorProvider>
                        )}
                    </Form>
                )}
            </FormData>
        );
    }
}
