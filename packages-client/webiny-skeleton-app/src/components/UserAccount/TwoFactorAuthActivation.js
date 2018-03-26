import React from "react";
import { app, createComponent, i18n } from "webiny-client";
import { ModalConfirmationComponent } from "webiny-client-ui";

/**
 * @i18n.namespace Webiny.Skeleton.UserAccount.TwoFactorAuthActivation
 */
class TwoFactorAuthActivation extends React.Component {
    render() {
        const { Ui, onCancel, onConfirm } = this.props;

        const formProps = {
            api: "/security/auth/2factor-verify",
            fields: "id,title",
            onSuccessMessage: null,
            onSubmitSuccess: ({ response }) => {
                if (response.data.data.result) {
                    onConfirm();
                } else {
                    app.services.get("growler").danger(i18n(`The code doesn't match`));
                }
            }
        };

        return (
            <Ui.Modal.Dialog>
                <Ui.Form {...formProps}>
                    {({ form }) => (
                        <Ui.Modal.Content>
                            <Ui.Modal.Header title={i18n("2Factor Auth")} onClose={onCancel} />
                            <Ui.Modal.Body>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={6}>
                                        <Ui.Section title={i18n("Step 1")} />
                                        <p>
                                            {i18n(
                                                "Install the Google Authenticator iOS or Android app:"
                                            )}{" "}
                                            <br />
                                        </p>
                                        <p>
                                            <Ui.Link url="https://itunes.apple.com/us/app/google-authenticator/id388497605?mt=8">
                                                <Ui.Icon icon="fa-apple" /> {i18n("iOS download")}
                                            </Ui.Link>
                                            <br />
                                            <Ui.Link url="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2&hl=en">
                                                <Ui.Icon icon="fa-android" />{" "}
                                                {i18n("Android download")}
                                            </Ui.Link>
                                        </p>
                                    </Ui.Grid.Col>

                                    <Ui.Grid.Col all={6}>
                                        <Ui.Section title={i18n("Step 2")} />
                                        <p>
                                            {i18n(
                                                "Scan the QR code below with the authenticator app"
                                            )}
                                        </p>
                                        {/*<Ui.Data api="/security/auth/2factor-qr" waitForData={true}>
                                            {({ data }) => (
                                                <Ui.Grid.Col all={12} className="text-center">
                                                    <img src={data.qrCode}/>
                                                </Ui.Grid.Col>
                                            )}
                                        </Ui.Data>*/}
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                                <Ui.Grid.Row>
                                    <Ui.Grid.Col all={12}>
                                        <Ui.Section title={i18n("Step 3")} />
                                        <Ui.Grid.Col all={12}>
                                            <Ui.Input
                                                label={i18n(
                                                    "Enter the generated code in the field below:"
                                                )}
                                                name="verification"
                                                validators="required"
                                            />
                                        </Ui.Grid.Col>
                                    </Ui.Grid.Col>
                                </Ui.Grid.Row>
                            </Ui.Modal.Body>
                            <Ui.Modal.Footer>
                                <Ui.Button
                                    type="default"
                                    label={i18n("Cancel")}
                                    onClick={onCancel}
                                />
                                <Ui.Button
                                    type="primary"
                                    label={i18n("Verify")}
                                    onClick={form.submit}
                                />
                            </Ui.Modal.Footer>
                        </Ui.Modal.Content>
                    )}
                </Ui.Form>
            </Ui.Modal.Dialog>
        );
    }
}

export default createComponent([TwoFactorAuthActivation, ModalConfirmationComponent], {
    modulesProp: "Ui",
    modules: ["Modal", "Data", "Grid", "Button", "Section", "Form", "Input", "Link", "Icon"]
});
