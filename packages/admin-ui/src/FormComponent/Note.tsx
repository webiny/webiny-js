import React from "react";
import { Text, type TextProps } from "~/Text/index.js";
import { cn, cva, makeDecoratable, type VariantProps } from "~/utils.js";
import { useAdminUi } from "~/AdminUiProvider/index.js";

const formComponentNoteVariants = cva("mt-sm text-neutral-strong", {
    variants: {
        disabled: {
            true: "text-neutral-disabled"
        }
    }
});

type FormComponentNoteProps = TextProps &
    VariantProps<typeof formComponentNoteVariants> & {
        text?: React.ReactNode;
    };

const DecoratableFormComponentNote = ({
    disabled,
    text,
    className,
    ...props
}: FormComponentNoteProps) => {
    const { compileMarkdown } = useAdminUi();

    if (!text) {
        return null;
    }

    return (
        <Text
            {...props}
            size={"sm"}
            as={"div"}
            className={cn(formComponentNoteVariants({ disabled }), className)}
        >
            {compileMarkdown(text)}
        </Text>
    );
};

const FormComponentNote = makeDecoratable("FormComponentNote", DecoratableFormComponentNote);

export { FormComponentNote, type FormComponentNoteProps };
