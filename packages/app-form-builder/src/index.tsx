import React, { Suspense, lazy } from "react";
import { Extensions, Layout, AddMenu, AddRoute } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { ReactComponent as FormsIcon } from "~/admin/icons/round-ballot-24px.svg";
import { CircularProgress } from "@webiny/ui/Progress";
import FormsSettings from "./admin/views/Settings/FormsSettings";

const FormEditor = lazy(() => import("./admin/views/Editor"));
const Forms = lazy(() => import("./admin/views/Forms/Forms"));

const Loader = ({ children, label, ...props }) => (
    <Suspense fallback={<CircularProgress label={label} />}>
        {React.cloneElement(children, props)}
    </Suspense>
);

export const FormBuilder = () => {
    return (
        <Extensions>
            <HasPermission name={"fb.form"}>
                <AddMenu id="formBuilder" label={"Form Builder"} icon={<FormsIcon />}>
                    <AddMenu id="formBuilder.forms" label={"Forms"}>
                        <AddMenu
                            id="formBuilder.forms.forms"
                            label={"Forms"}
                            path="/form-builder/forms"
                        />
                    </AddMenu>
                </AddMenu>
                <AddRoute exact path={"/form-builder/forms/:id"}>
                    <Loader label={"Loading editor..."}>
                        <FormEditor />
                    </Loader>
                </AddRoute>
                <AddRoute exact path={"/form-builder/forms"}>
                    <Layout title={"Form Builder - Forms"}>
                        <Loader label={"Loading view..."}>
                            <Forms />
                        </Loader>
                    </Layout>
                </AddRoute>
            </HasPermission>
            <HasPermission name={"fb.settings"}>
                <AddRoute path="/settings/form-builder/recaptcha">
                    <Layout title={"Form Builder - reCAPTCHA Settings"}>
                        <FormsSettings />
                    </Layout>
                </AddRoute>
                <AddMenu id={"settings"}>
                    <AddMenu id={"settings.formBuilder"} label={"Form Builder"}>
                        <AddMenu
                            id={"settings.formBuilder.recaptcha"}
                            label={"reCAPTCHA"}
                            path={"/settings/form-builder/recaptcha"}
                        />
                    </AddMenu>
                </AddMenu>
            </HasPermission>
        </Extensions>
    );
};
