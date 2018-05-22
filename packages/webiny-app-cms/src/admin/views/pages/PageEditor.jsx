import React from "react";
import { createComponent, i18n } from "webiny-app";
import TitleInput from "./components/editor/TitleInput";
import PageContent from "./components/editor/PageContent";

const t = i18n.namespace("Cms.Admin.Views.PageEditor");

class PageEditor extends React.Component {
    filterContent({ content, ...model }, submit) {
        model.content = content.map(widget => {
            if (widget.origin) {
                delete widget["data"];
            }

            return widget;
        });

        submit(model);
    }

    render() {
        const { View, Link, Form, FormData, FormError, Icon, Loader } = this.props.modules;

        return (
            <FormData
                withRouter
                entity={"CmsRevision"}
                defaultModel={{ content: [] }}
                fields={"id name active title slug content { id type data }"}
            >
                {({ model, submit, error, loading }) => (
                    <Form model={model} onSubmit={model => this.filterContent(model, submit)}>
                        {({ submit, model, Bind }) => (
                            <View.Form>
                                {loading && <Loader />}
                                <View.Header
                                    render={({ props }) => (
                                        <div
                                            className={props.styles.viewHeader}
                                            style={{ padding: "20px 50px" }}
                                        >
                                            <div className={props.styles.titleWrapper}>
                                                <Bind>
                                                    <TitleInput name={"title"} />
                                                </Bind>
                                            </div>
                                            <div className={props.styles.titleRight}>
                                                {props.children}
                                            </div>
                                            <div style={{ marginTop: 5 }}>
                                                Revision: <strong>{model.name}</strong> ({model.active
                                                    ? `active`
                                                    : `inactive`})
                                            </div>
                                        </div>
                                    )}
                                >
                                    <Link url={`/cms/preview/${model.id}`} type="secondary" newTab>
                                        <Icon icon={"eye"} /> {t`Preview`}
                                    </Link>
                                    <Link type="primary" align="right" onClick={submit}>
                                        {t`Save page`}
                                    </Link>
                                </View.Header>
                                {error && (
                                    <View.Error>
                                        <FormError error={error} />
                                    </View.Error>
                                )}
                                <View.Body noPadding noColor style={{ paddingTop: 15 }}>
                                    <Bind>
                                        <PageContent name={"content"} />
                                    </Bind>
                                </View.Body>
                            </View.Form>
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
        "View",
        "Link",
        "Icon",
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
