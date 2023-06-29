import React from "react";
import { Admin, HasPermission, useSecurity } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";

const { Form } = ContentEntryEditorConfig;

const MyAction = () => {
    return null;
};

const MenuItemAction = (props: any) => {
    return null;
};

MenuItemAction.useMenuItemComponents = useMenuItemComponents;

const ButtonAction = (props: any) => {
    return null;
};

const SendAsPdfNoProps = () => {
    const { MenuItem } = useMenuItemComponents();

    return <MenuItem icon={<span />} label={"Label"} onAction={sendPdf} />;
};

const SendAsPdf = ({ MenuItem, DisabledMenuItem, MenuItemWithIcon }) => {
    const { identity } = useSecurity();

    const sendPdf = () => {
        //
    };

    return <MenuItem icon={<span />} label={"Label"} onAction={sendPdf} />;
};

const CustomButton = props => {};

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
                <MenuItemAction name={"new-action"} component={SendAsPdf} />
                <MenuItemAction name={"save"} with={SendAsPdf} />
                <MenuItemAction name={"new-action-2"} element={<SendAsPdfNoProps />} />
            </ContentEntryEditorConfig>
            <Plugin>
                <ConditionalRevisions />
            </Plugin>
        </Admin>
    );
};

const ConditionalRevisions = () => {
    return (
        <NotHasPermission name={"content-writer"}>
            <ContentEntryEditorConfig>
                <ContentEntryEditorConfig.Revisions visible={false} />
            </ContentEntryEditorConfig>
        </NotHasPermission>
    );
};

// ContentEntryEditorConfig.Actions.MenuItemAction
// ContentEntryEditorConfig.Actions.ButtonAction

// ContentEntryListConfig.Actions.ButtonAction
// ContentEntryListConfig.Table.Actions.ButtonAction
