import React from "react";
import { RegisterFeature } from "webiny/admin";
import { CustomIdpFeature } from "./features/CustomIdp/feature.js";
import { CustomIdpView } from "./presentation/CustomIdpView.js";

export const Extension = () => {
    return (
        <>
            {/* Register the feature which manages all the mechanics related to your IDP. */}
            <RegisterFeature
                feature={CustomIdpFeature}
                options={{
                    loginUrl: "http://localhost:3000/login",
                    refreshUrl: "http://localhost:3000/refresh",
                    refreshIntervalSeconds: 60
                }}
            />
            {/* Register your custom login screen. */}
            <CustomIdpView />
        </>
    );
};
