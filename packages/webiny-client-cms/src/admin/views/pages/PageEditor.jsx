import React from "react";
import { app, inject } from "webiny-client";
import PageContent from "./PageEditor/PageContent";
import Header from "./PageEditor/Header";
import { PageEditorProvider } from "../../utils/context/pageEditorContext";
import styles from "./PageEditor.scss?prefix=wby-cms-editor";

@inject({
    modules: ["Loader", "Form", "FormData", "FormError"]
})
class PageEditor extends React.Component {
    state = {
        widgetPresets: []
    };

    async componentDidMount() {
        this.loadWidgetPresets();
    }

    loadWidgetPresets = () => {
        // Load widgetPresets
        const listWidgetPresets = app.graphql.generateList("CmsWidgetPreset");
        listWidgetPresets({
            fields: "id type title data",
            variables: { sort: "title", perPage: 1000 }
        }).then(({ data }) => {
            this.setState({ widgetPresets: data.list });
        });
    };

    createPreset = (title, type, data) => {
        const create = app.graphql.generateCreate("CmsWidgetPreset", "id");

        return create({ variables: { data: { title, type, data } } }).then(this.loadWidgetPresets);
    };

    deletePreset = id => {
        const deletePreset = app.graphql.generateDelete("CmsWidgetPreset");

        return deletePreset({ variables: { id } }).then(this.loadWidgetPresets);
    };

    getEditorProviderValue = revision => {
        return {
            revision,
            widgetPresets: this.state.widgetPresets,
            createPreset: this.createPreset,
            deletePreset: this.deletePreset
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
                    <Form model={model} onSubmit={submit}>
                        {({ submit, model, Bind }) => (
                            <PageEditorProvider value={this.getEditorProviderValue(model)}>
                                <div className={styles.editorContainer}>
                                    {loading && <Loader />}
                                    <Header page={model} onSave={submit} Bind={Bind} />
                                    {error && (
                                        <div className={styles.error}>
                                            <FormError error={error} />
                                        </div>
                                    )}
                                    <Bind name={"content"}>
                                        <PageContent page={model} />
                                    </Bind>
                                </div>
                            </PageEditorProvider>
                        )}
                    </Form>
                )}
            </FormData>
        );
    }
}

export default PageEditor;
