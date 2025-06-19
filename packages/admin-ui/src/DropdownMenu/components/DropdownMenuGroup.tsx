import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { makeDecoratable } from "~/utils";

const DropdownMenuGroupBase = DropdownMenuPrimitive.Group;
export const DropdownMenuGroup = makeDecoratable("DropdownMenuGroup", DropdownMenuGroupBase);
