import React from "react";
import {
    ButtonDefault,
    ButtonPrimary,
    ButtonSecondary,
    ButtonOutline,
    Icon,
    Accordion,
    AccordionItem
} from "@webiny/ui-chakra";
import { Typography } from "@webiny/ui/Typography";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/outlined/add.svg";
import { ReactComponent as DashboardIcon } from "@material-design-icons/svg/outlined/space_dashboard.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/outlined/delete.svg";
import { ReactComponent as CopyIcon } from "@material-design-icons/svg/outlined/copy_all.svg";
import { ReactComponent as ArrowUp } from "@material-design-icons/svg/outlined/keyboard_arrow_up.svg";
import { ReactComponent as ArrowDown } from "@material-design-icons/svg/outlined/keyboard_arrow_down.svg";

const Welcome = () => {
    return (
        <>
            <div style={{ margin: "60px 15px" }}>
                <Typography use={"headline4"} style={{ marginBottom: "30px" }}>
                    Accordion
                </Typography>
                <div style={{ margin: "60px 15px" }}>
                    <Accordion allowMultiple={true} defaultIndex={2}>
                        <AccordionItem
                            key={"item-1"}
                            title={"Page builder"}
                            description={"Manage Page Builder app access permissions"}
                            icon={<DashboardIcon />}
                            actions={
                                <AccordionItem.Actions>
                                    <AccordionItem.Action
                                        icon={<DeleteIcon />}
                                        onClick={() => console.log("click")}
                                    />
                                    <AccordionItem.Action
                                        icon={<CopyIcon />}
                                        onClick={() => console.log("click")}
                                    />
                                    <AccordionItem.Divider />
                                    <AccordionItem.Action
                                        icon={<ArrowUp />}
                                        onClick={() => console.log("click")}
                                    />
                                    <AccordionItem.Action
                                        icon={<ArrowDown />}
                                        onClick={() => console.log("click")}
                                    />
                                </AccordionItem.Actions>
                            }
                        >
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                            commodo consequat.
                        </AccordionItem>
                        <AccordionItem
                            key={"item-2"}
                            title={"Headless CMS"}
                            description={"Manage Headless CMS app access permissions"}
                            icon={<DashboardIcon />}
                        >
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                            commodo consequat.
                        </AccordionItem>
                        <AccordionItem
                            key={"item-3"}
                            title={"File Manager"}
                            description={"Manage File Manager app access permissions"}
                            icon={<DashboardIcon />}
                        >
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
                            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
                            veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
                            commodo consequat.
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
            <div style={{ margin: "60px 15px" }}>
                <Typography use={"headline4"} style={{ marginBottom: "30px" }}>
                    Button
                </Typography>
                <div style={{ margin: "60px 15px" }}>
                    <Typography use={"headline6"} style={{ marginBottom: "30px" }}>
                        Size Small
                    </Typography>
                    <ButtonPrimary size={"sm"} mx={2}>
                        Button
                    </ButtonPrimary>
                    <ButtonSecondary size={"sm"} mx={2}>
                        Button
                    </ButtonSecondary>
                    <ButtonOutline size={"sm"} mx={2}>
                        Button
                    </ButtonOutline>
                    <ButtonDefault size={"sm"} mx={2}>
                        Button
                    </ButtonDefault>
                </div>
                <div style={{ margin: "60px 15px" }}>
                    <Typography use={"headline6"} style={{ marginBottom: "30px" }}>
                        Size Medium
                    </Typography>
                    <ButtonPrimary size={"md"} mx={2}>
                        Button
                    </ButtonPrimary>
                    <ButtonSecondary size={"md"} mx={2}>
                        Button
                    </ButtonSecondary>
                    <ButtonOutline size={"md"} mx={2}>
                        Button
                    </ButtonOutline>
                    <ButtonDefault size={"md"} mx={2}>
                        Button
                    </ButtonDefault>
                </div>
                <div style={{ margin: "60px 15px" }}>
                    <Typography use={"headline6"} style={{ marginBottom: "30px" }}>
                        Size Large
                    </Typography>
                    <ButtonPrimary size={"lg"} mx={2}>
                        Button
                    </ButtonPrimary>
                    <ButtonSecondary size={"lg"} mx={2}>
                        Button
                    </ButtonSecondary>
                    <ButtonOutline size={"lg"} mx={2}>
                        Button
                    </ButtonOutline>
                    <ButtonDefault size={"lg"} mx={2}>
                        Button
                    </ButtonDefault>
                </div>
                <div style={{ margin: "60px 15px" }}>
                    <Typography use={"headline6"} style={{ marginBottom: "30px" }}>
                        Size Extra Large
                    </Typography>
                    <ButtonPrimary size={"xl"} mx={2}>
                        <Icon fill={"white"} mr={2}>
                            <AddIcon />
                        </Icon>{" "}
                        Button
                    </ButtonPrimary>
                    <ButtonSecondary size={"xl"} mx={2}>
                        Button
                        <Icon fill={"gray.900"} ml={2}>
                            <AddIcon />
                        </Icon>
                    </ButtonSecondary>
                    <ButtonOutline size={"xl"} mx={2}>
                        <Icon fill={"gray.900"} mr={2}>
                            <AddIcon />
                        </Icon>
                        Button
                    </ButtonOutline>
                    <ButtonDefault size={"xl"} mx={2}>
                        <Icon fill={"gray.900"} mr={2}>
                            <AddIcon />
                        </Icon>
                        Button
                    </ButtonDefault>
                </div>
            </div>
        </>
    );
};

export default Welcome;
