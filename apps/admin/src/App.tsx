import React from "react";
import { Admin, useSecurity } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";

const { Form } = ContentEntryEditorConfig;

const MyAction = () => {
    return null;
};

const MenuItemAction = (props: any) => {
    return null;
};

const ButtonAction = (props: any) => {
    return null;
};

const SendAsPdfAction = () => {
    const { identity } = useSecurity();

    const sendPdf = () => {
        //
    };

    return (
        <MenuItemAction
            icon={<span />}
            name={"new-action"}
            after={"delete"}
            label={"Send as PDF"}
            onAction={sendPdf}
        />
    );
};

const CustomButton = props => {

}


const SaveAction = () => {
    const { identity } = useSecurity();

    const save = () => {
        //
    };

    return (
        <ButtonAction
            icon={<span />}
            name={"save-action"}
            label={"Save"}
            onAction={save}
            component={CustomButton}
        />
    );
};

import "./App.scss";

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <ContentEntryEditorConfig>
                <Form.Action
                    name={"new-action"}
                    after={"save"}
                    element={<MyAction />}
                    position={"primary"}
                />
                <SendAsPdfAction />
            </ContentEntryEditorConfig>
        </Admin>
    );
};
