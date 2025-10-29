import React from "react";

import { Bind } from "@webiny/form";
import { useInputField } from "~/components/index.js";
import { RadioGroup } from "@webiny/admin-ui";

export const Boolean = () => {
    const { name } = useInputField();

    return (
        <Bind name={name}>
            {({ value, onChange, validation }) => (
                <div className="w-full mt-lg">
                    <RadioGroup
                        validation={validation}
                        onChange={onChange}
                        value={value}
                        items={[
                            {
                                label: "True",
                                value: "true"
                            },
                            {
                                label: "False",
                                value: "false"
                            }
                        ]}
                    />
                </div>
            )}
        </Bind>
    );
};
