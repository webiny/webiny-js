import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn, withStaticProps } from "~/utils.js";
import { Empty, Group, Input, Item, List, Loading, Separator } from "./components/index.js";

type CommandProps = React.ComponentPropsWithoutRef<typeof CommandPrimitive>;

const CommandBase = ({
    className,
    ...props
}: React.ComponentPropsWithoutRef<typeof CommandPrimitive>) => (
    <CommandPrimitive
        className={cn("flex h-full w-full flex-col outline-none", className)}
        {...props}
    />
);

const Command = withStaticProps(CommandBase, {
    Empty,
    Group,
    Input,
    Item,
    List,
    Loading,
    Separator
});

export { Command, type CommandProps };
