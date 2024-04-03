import React from "react";
import { Admin, createDecorator } from "@webiny/app-serverless-cms";
import { Cognito } from "@webiny/app-admin-users-cognito";
import { useContentEntriesList } from "@webiny/app-headless-cms";
import "./App.scss";

const HookDecorator = createDecorator(useContentEntriesList, originalHook => {
    return function () {
        // Call the original hook
        const value = originalHook();

        // Return the decorated value
        return {
            ...value,
            records: value.records.map(record => {
                return { ...record, locked: true };
            })
        };
    };
});

export const App = () => {
    return (
        <Admin>
            <Cognito />
            <HookDecorator />
        </Admin>
    );
};
