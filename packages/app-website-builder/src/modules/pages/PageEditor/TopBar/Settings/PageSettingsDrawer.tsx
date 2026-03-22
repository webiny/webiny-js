import React, { Fragment, useRef, useState } from "react";
import { Form, type FormAPI } from "@webiny/form";
import { Drawer, Heading, Text, List, Grid } from "@webiny/admin-ui";
import type { PageSettingsOverlayProps } from "~/modules/pages/PageEditor/TopBar/SettingsButton.js";
import { usePageEditorConfig } from "~/modules/pages/PageEditor/usePageEditorConfig.js";

export const PageSettingsDrawer = ({ open, data, onSave, onClose }: PageSettingsOverlayProps) => {
    const formRef = useRef<FormAPI | undefined>();
    const { pageSettings } = usePageEditorConfig();

    const groups = pageSettings.groups;

    const [activeGroup, setActiveGroup] = useState(groups[0].name);

    const group = groups.find(g => g.name === activeGroup);

    let activeContent = null;
    if (group) {
        activeContent = group.elements.map((el, index) => (
            <Fragment key={index}>{el.element}</Fragment>
        ));
    }

    return (
        <Drawer
            open={open}
            onClose={onClose}
            modal={true}
            width={900}
            bodyPadding={false}
            title={"Page Settings"}
            actions={
                <>
                    <Drawer.CancelButton text={"Cancel"} />
                    <Drawer.ConfirmButton
                        onClick={() => formRef.current?.submit()}
                        text={"Save Settings"}
                    />
                </>
            }
            headerSeparator={true}
            footerSeparator={true}
            className={"flex flex-col"}
        >
            <div className={"flex flex-row flex-1 min-h-full shrink-0"}>
                <div className={"flex flex-col"} style={{ width: 300 }}>
                    <List>
                        {groups.map(group => (
                            <List.Item
                                className={"fill-neutral-strong"}
                                icon={group.icon}
                                key={group.name}
                                title={group.title}
                                description={group.description}
                                activated={activeGroup === group.name}
                                onClick={() => setActiveGroup(group.name)}
                            />
                        ))}
                    </List>
                </div>
                <div className={"flex flex-col flex-1 p-md border-l border-neutral-dimmed"}>
                    <div className={"p-md"}>
                        <Heading level={4} className={"text-neutral-primary"}>
                            {group?.title}
                        </Heading>
                        <Text size={"sm"}>{group?.description}</Text>
                    </div>
                    <div className={"p-md"}>
                        <Form data={data} ref={formRef} onSubmit={onSave}>
                            {() => <Grid>{activeContent}</Grid>}
                        </Form>
                    </div>
                </div>
            </div>
        </Drawer>
    );
};
