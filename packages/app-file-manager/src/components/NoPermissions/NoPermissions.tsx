import React from "react";
import { Heading, Text } from "@webiny/admin-ui";
import { ReactComponent as VisibilityOffIcon } from "@webiny/icons/visibility_off.svg";

export const NoPermissions = () => {
    return (
        <div
            className={
                "w-full h-full p-lg flex items-center justify-center bg-neutral-base"
            }
        >
            <div className={"flex flex-col items-center justify-center gap-sm"}>
                <div className={"fill-neutral-strong"}>
                    <VisibilityOffIcon width={75} height={75} />
                </div>
                <div className={"text-center"}>
                    <Heading level={4} className={"text-neutral-strong"}>
                        {"Permission Required"}
                    </Heading>
                    <Text
                        as={"div"}
                        style={{
                            width: "300px"
                        }}
                        className={"text-neutral-strong"}
                    >
                        {
                            "You don’t have the necessary permissions to access these files. Please contact your administrator for access."
                        }
                    </Text>
                </div>
            </div>
        </div>
    );
};
