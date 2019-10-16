import React from "react";
import { ButtonPrimary } from "@webiny/ui/Button";
import { useSecurity } from "@webiny/app-security/hooks/useSecurity";

export default [
    {
        name: "install-random",
        type: "install",
        dependencies: ["install-security"],
        secure: false,
        async isInstalled({ client }) {
            return false;
        },
        render({ onInstalled }) {
            return (
                <div>
                    Random installer{" "}
                    <ButtonPrimary onClick={onInstalled}>Install random app</ButtonPrimary>
                </div>
            );
        }
    },
    {
        name: "install-i18n",
        type: "install",
        secure: true,
        async isInstalled({ client }) {
            return false;
        },
        render({ onInstalled }) {
            return <I18nInstaller onInstalled={onInstalled} />;
        }
    }
];

const I18nInstaller = ({ onInstalled }) => {
    const { user } = useSecurity();
    return (
        <div>
            i18n installer{" "}
            <span>
                User: <strong>{user.email}</strong>
            </span>
            <ButtonPrimary onClick={onInstalled}>Install i18n</ButtonPrimary>
        </div>
    );
};
