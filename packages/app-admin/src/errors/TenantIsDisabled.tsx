import React from "react";

import { Card, Text } from "@webiny/admin-ui";

export const TenantIsDisabled = () => {
    return (
        <div className="absolute flex w-full h-screen bg-neutral-light" style={{ top: 0, left: 0 }}>
            <div className="m-auto max-w-1/2">
                <Card
                    title="Your account is currently unavailable"
                    padding="md"
                    elevation="medium"
                    cornerSize={"md"}
                    variant={"accent"}
                >
                    <Text as={"div"}>
                        Access to this workspace has been paused. If you believe this is a mistake,
                        please reach out to your organization&apos;s administrator for help.
                    </Text>
                </Card>
            </div>
        </div>
    );
};
