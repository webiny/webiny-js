import React from "react";
import { createComponent, i18n } from "webiny-app";
import TitleInput from "./components/editor/TitleInput";
import PageContent from "./components/editor/PageContent";
import data from "./data";

const t = i18n.namespace("Cms.Admin.Views.PageEditor");

class PageEditor extends React.Component {
    render() {
        const { View, Link, Form, Icon } = this.props.modules;

        const formProps = {
            model: data
        };

        return (
            <Form {...formProps}>
                {({ Bind }) => (
                    <View.Form>
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
                                    <div className={props.styles.titleRight}>{props.children}</div>
                                </div>
                            )}
                        >
                            <Link type="secondary">
                                <Icon icon={["fa", "eye"]} /> {t`Preview`}
                            </Link>
                            <Link type="primary" align="right">
                                {t`Save page`}
                            </Link>
                        </View.Header>
                        <View.Body noPadding noColor style={{ paddingTop: 15 }}>
                            <Bind>
                                <PageContent name={"content"} />
                            </Bind>
                        </View.Body>
                    </View.Form>
                )}
            </Form>
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
        "Dropdown",
        "Checkbox",
        "Grid",
        "Modal",
        "Tabs",
        "Form",
        "Button"
    ]
});
