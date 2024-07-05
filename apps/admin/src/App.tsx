import React from "react";
import { Helmet } from "react-helmet";
import {
    Button,
    Accordion,
    AccordionItem,
    AccordionContent,
    AccordionDivider,
    AccordionTrigger,
    AccordionItemAction,
    AccordionItemActions
} from "@webiny/ui-shadcn";
import { ReactComponent as DashboardIcon } from "@material-design-icons/svg/outlined/space_dashboard.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as CopyIcon } from "@material-design-icons/svg/outlined/copy_all.svg";
import { ReactComponent as ArrowUp } from "@material-design-icons/svg/outlined/keyboard_arrow_up.svg";
import { ReactComponent as ArrowDown } from "@material-design-icons/svg/outlined/keyboard_arrow_down.svg";

import "./styles/output.css";

export const App = () => {
    return (
        <>
            <Helmet>
                <script src="https://cdn.tailwindcss.com"></script>
            </Helmet>
            <div className={"p-10 text-xl font-sans bg-white min-h-full"}>
                <div className={"mb-10 w-3/4"}>
                    <h2>Accordion</h2>
                    <Accordion type="multiple">
                        <AccordionItem value="item-1">
                            <AccordionTrigger
                                title={"Page Builder"}
                                description={"Manage Page Builder app access permissions"}
                                icon={<DashboardIcon />}
                                actions={
                                    <AccordionItemActions>
                                        <AccordionItemAction
                                            icon={<DeleteIcon />}
                                            onClick={() => console.log("click")}
                                        />
                                        <AccordionItemAction
                                            icon={<CopyIcon />}
                                            onClick={() => console.log("click")}
                                        />
                                        <AccordionDivider />
                                        <AccordionItemAction
                                            icon={<ArrowUp />}
                                            onClick={() => console.log("click")}
                                        />
                                        <AccordionItemAction
                                            icon={<ArrowDown />}
                                            onClick={() => console.log("click")}
                                        />
                                    </AccordionItemActions>
                                }
                            />
                            <AccordionContent>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas
                                hendrerit nunc sem, sollicitudin suscipit sapien luctus eu. Donec
                                dignissim sapien ac dui feugiat hendrerit. In hac habitasse platea
                                dictumst. Fusce molestie condimentum justo, in fringilla ipsum
                                lobortis non. Etiam lectus nunc, consectetur id lorem in, pretium
                                ornare ante.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger
                                title={"Headless CMS"}
                                description={"Manage Headless CMS app access permissions"}
                                icon={<DashboardIcon />}
                            />
                            <AccordionContent>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas
                                hendrerit nunc sem, sollicitudin suscipit sapien luctus eu. Donec
                                dignissim sapien ac dui feugiat hendrerit. In hac habitasse platea
                                dictumst. Fusce molestie condimentum justo, in fringilla ipsum
                                lobortis non. Etiam lectus nunc, consectetur id lorem in, pretium
                                ornare ante.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger
                                title={"File Manager"}
                                description={"Manage File Manager app access permissions"}
                                icon={<DashboardIcon />}
                            />
                            <AccordionContent>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas
                                hendrerit nunc sem, sollicitudin suscipit sapien luctus eu. Donec
                                dignissim sapien ac dui feugiat hendrerit. In hac habitasse platea
                                dictumst. Fusce molestie condimentum justo, in fringilla ipsum
                                lobortis non. Etiam lectus nunc, consectetur id lorem in, pretium
                                ornare ante.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
                <div className={"mb-10"}>
                    <h2>Button</h2>
                    <div className={"flex space-x-4 mt-6"}>
                        <Button variant={"primary"} size={"sm"}>
                            Button
                        </Button>
                        <Button variant={"secondary"} size={"sm"}>
                            Button
                        </Button>
                        <Button variant={"outline"} size={"sm"}>
                            Button
                        </Button>
                        <Button variant={"ghost"} size={"sm"}>
                            Button
                        </Button>
                    </div>
                    <div className={"flex space-x-4 mt-6"}>
                        <Button variant={"primary"} size={"md"}>
                            Button
                        </Button>
                        <Button variant={"secondary"} size={"md"}>
                            Button
                        </Button>
                        <Button variant={"outline"} size={"md"}>
                            Button
                        </Button>
                        <Button variant={"ghost"} size={"md"}>
                            Button
                        </Button>
                    </div>
                    <div className={"flex space-x-4 mt-6"}>
                        <Button variant={"primary"} size={"lg"}>
                            Button
                        </Button>
                        <Button variant={"secondary"} size={"lg"}>
                            Button
                        </Button>
                        <Button variant={"outline"} size={"lg"}>
                            Button
                        </Button>
                        <Button variant={"ghost"} size={"lg"}>
                            Button
                        </Button>
                    </div>
                    <div className={"flex space-x-4 mt-6"}>
                        <Button variant={"primary"} size={"xl"}>
                            Button
                        </Button>
                        <Button variant={"secondary"} size={"xl"}>
                            Button
                        </Button>
                        <Button variant={"outline"} size={"xl"}>
                            Button
                        </Button>
                        <Button variant={"ghost"} size={"xl"}>
                            Button
                        </Button>
                    </div>
                </div>
                <div className={"mb-10"}>
                    <h2>ButtonIcon</h2>
                    <div className={"flex space-x-4 mt-6"}>
                        <Button variant={"primary"} size={"sm"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"secondary"} size={"sm"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"outline"} size={"sm"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"ghost"} size={"sm"}>
                            <DeleteIcon />
                        </Button>
                    </div>
                    <div className={"flex space-x-4 mt-6"}>
                        <Button variant={"primary"} size={"md"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"secondary"} size={"md"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"outline"} size={"md"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"ghost"} size={"md"}>
                            <DeleteIcon />
                        </Button>
                    </div>
                    <div className={"flex space-x-4 mt-6"}>
                        <Button variant={"primary"} size={"lg"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"secondary"} size={"lg"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"outline"} size={"md"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"ghost"} size={"lg"}>
                            <DeleteIcon />
                        </Button>
                    </div>
                    <div className={"flex space-x-4 mt-6"}>
                        <Button variant={"primary"} size={"xl"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"secondary"} size={"xl"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"outline"} size={"xl"}>
                            <DeleteIcon />
                        </Button>
                        <Button variant={"ghost"} size={"xl"}>
                            <DeleteIcon />
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
};
