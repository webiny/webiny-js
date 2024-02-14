import React from "react";
import { Admin, createComponentPlugin } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { Components } from "@webiny/app-headless-cms";
import "./App.scss";

const MyCustomComponent = createComponentPlugin(
    Components.FieldRenderers.DynamicZone.ContentItem,
    Original => {
        return function MyCustomComponent(props) {
            const { field, children } = props;

            console.log(props.bind);

            return (
                <Original {...props} title={`${field.label} - ${field.type}`}>
                    {children}
                </Original>
            );
        };
    }
);

export const App: React.FC = () => {
    return (
        <Admin>
            <Cognito />
            <MyCustomComponent />
        </Admin>
    );
};
