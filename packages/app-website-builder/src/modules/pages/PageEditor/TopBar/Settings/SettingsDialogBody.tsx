import React from "react";
import { Tabs, Grid } from "@webiny/admin-ui";
import type { EditorPageSettings } from "~/modules/pages/PageEditor/usePageEditorConfig.js";

export interface SettingsDialogBodyProps {
    pageSettings: EditorPageSettings;
}

export const SettingsDialogBody = ({ pageSettings }: SettingsDialogBodyProps) => {
    return (
        <Tabs
            tabs={pageSettings.groups.map(group => (
                <Tabs.Tab
                    key={group.name}
                    value={group.name}
                    trigger={group.title}
                    icon={group.icon as React.ReactElement}
                    content={
                        <Grid className={"mt-md"}>
                            {(group.elements || []).map(el => (
                                <React.Fragment key={el.name}>{el.element}</React.Fragment>
                            ))}
                        </Grid>
                    }
                />
            ))}
        />
    );
};
