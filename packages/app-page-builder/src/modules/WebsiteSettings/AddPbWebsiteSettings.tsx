import React, { createContext, FC, Fragment, memo, useContext, useEffect, useMemo } from "react";
import {
    Compose,
    useViewComposition,
    DebounceRender,
    AddGraphQLQuerySelection
} from "@webiny/app-admin";
import { SimpleFormHeader, SimpleFormContent } from "@webiny/app-admin/components/SimpleForm";
import { Cell, Grid } from "@webiny/ui/Grid";
import { SettingsFields } from "./WebsiteSettingsView";
import { DocumentNode } from "graphql";

const GroupContext = createContext(null);

interface Props {
    name: string;
}

const VIEW_NAME = "PbWebsiteSettings";

const tracker = {};

const GenerateElements = memo(({ name }: Props) => {
    if (tracker[name]) {
        return null;
    }

    tracker[name] = true;

    const ElementsHOC = Fields => {
        return function Elements() {
            const { getViewElement } = useViewComposition();
            const element = getViewElement(VIEW_NAME, name);

            if (!element) {
                return null;
            }

            return (
                <Fragment>
                    <Fields />
                    <SimpleFormHeader title={element.label} />
                    <SimpleFormContent>
                        <Grid>
                            {element.elements.map((el, index) => (
                                <Cell key={index} span={12}>
                                    {el}
                                </Cell>
                            ))}
                        </Grid>
                    </SimpleFormContent>
                </Fragment>
            );
        };
    };

    return <Compose component={SettingsFields} with={ElementsHOC} />;
});

GenerateElements.displayName = "GenerateElements";

export interface GroupProps {
    name: string;
    querySelection?: DocumentNode;
    label?: string;
}

const Group: FC<GroupProps> = ({ name, label, querySelection, children }) => {
    const viewComposition = useViewComposition();

    const context = useMemo(
        () => ({
            addElement(element) {
                viewComposition.setViewElement(VIEW_NAME, name, existing => {
                    return {
                        ...existing,
                        label: label || (existing && existing.label),
                        elements: [...((existing && existing.elements) || []), element]
                    };
                });
            }
        }),
        []
    );

    return (
        <GroupContext.Provider value={context}>
            {children}
            <DebounceRender wait={50}>
                <GenerateElements name={name} />
            </DebounceRender>
            {querySelection && (
                <Fragment>
                    <AddGraphQLQuerySelection
                        operationName={"UpdateSettings"}
                        selectionPath={"pageBuilder.updateSettings.data"}
                        addSelection={querySelection}
                    />
                    <AddGraphQLQuerySelection
                        operationName={"PbGetSettings"}
                        selectionPath={"pageBuilder.getSettings.data"}
                        addSelection={querySelection}
                    />
                </Fragment>
            )}
        </GroupContext.Provider>
    );
};

const Element = ({ children }) => {
    const { addElement } = useContext(GroupContext);

    useEffect(() => {
        addElement(children);
    }, []);

    return null;
};

export const AddPbWebsiteSettings = {
    Group,
    Element
};
