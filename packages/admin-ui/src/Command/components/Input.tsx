import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { InputPrimitive, InputPrimitiveProps } from "~/Input";

type InputProps = Omit<React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>, "size"> &
    InputPrimitiveProps & {
        inputElement?: React.ReactNode;
    };

const Input = ({ inputElement, size, inputRef, ...props }: InputProps) => {
    return (
        <CommandPrimitive.Input asChild {...props}>
            {inputElement ?? (
                <InputPrimitive size={size} forwardEventOnChange={true} inputRef={inputRef} />
            )}
        </CommandPrimitive.Input>
    );
};

export { Input, type InputProps };
