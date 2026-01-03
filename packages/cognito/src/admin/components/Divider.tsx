import React from "react";
import { Separator, Text } from "@webiny/admin-ui";

export const Divider = () => {
    return (
        <div className={"relative my-lg"}>
            <div className={"absolute inset-0 flex items-center"}>
                <Separator />
            </div>
            <div className={"relative flex justify-center"}>
                <Text size={"sm"} className={"text-neutral-strong px-sm bg-neutral-base uppercase"}>
                    {"Or continue with"}
                </Text>
            </div>
        </div>
    );
};
