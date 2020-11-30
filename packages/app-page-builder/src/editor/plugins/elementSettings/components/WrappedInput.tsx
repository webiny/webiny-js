import React from "react";
import { Input } from "@webiny/ui/Input";

const WrappedInput = ({ className, value, onChange, description, ...props }) => {
    return (
        <div>
            <Input
                className={className}
                description={description}
                value={value}
                onChange={onChange}
                type={"number"}
                {...props}
            />
        </div>
    );
};

export default React.memo(WrappedInput);
