import React from "react";
import { createComponent, i18n } from "webiny-client";

const t = i18n.namespace("Webiny.Skeleton.UserAccount.TwoFactorAuthConfirmation");

// TODO: @i18nRefactor Class extended old "Webiny.Ui.ModalComponent".
class TwoFactorAuthConfirmation extends React.Component {
    renderDialog() {
        const { Modal, Data, Grid, Alert, Button, Section } = this.props;

        return (
            <Modal.Dialog>
                <Modal.Content>
                    <Modal.Header title={t`Two Factor Auth`} />
                    <Modal.Body>
                        <Grid.Row>
                            <Grid.Col all={12}>
                                <Alert type="success" title={t`Success`}>
                                    {t`Your two factor authentication is now active.`}
                                </Alert>
                            </Grid.Col>
                            <Grid.Col all={4}>
                                <Section title={t`Recovery codes`} icon="fa-lock" />
                                <Data
                                    api="/entities/webiny/user/2factor-recovery-codes"
                                    waitForData
                                >
                                    {({ data }) => <pre>{data.recoveryCodes}</pre>}
                                </Data>
                            </Grid.Col>
                            <Grid.Col all={8}>
                                <Section title={t`Important`} icon="fa-exclamation" />
                                <p>
                                    {t`Please write down the recovery codes. In case you can't
                                                generate a code via the authenticator app for some reason,
                                                you can use a recovery code to access your account.`}
                                </p>
                                <p>{t`Note that once you use a specific code, it gets deleted.`}</p>
                            </Grid.Col>
                        </Grid.Row>
                    </Modal.Body>
                    <Modal.Footer clasName="text-center">
                        <Button
                            type="primary"
                            label={t`I've noted the recovery codes`}
                            onClick={this.hide}
                        />
                    </Modal.Footer>
                </Modal.Content>
            </Modal.Dialog>
        );
    }
}

export default createComponent(TwoFactorAuthConfirmation, {
    modules: ["Modal", "Data", "Grid", "Alert", "Button", "Section"]
});
