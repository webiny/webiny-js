import React, { createContext, Fragment, memo, useContext, useEffect, useMemo } from "react";
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

interface GroupContextValue {
    /**
     * Need to figure out better element type.
     * @param element
     */
    // TODO @ts-refactor
    addElement: (element: any) => void;
}
const GroupContext = createContext<GroupContextValue>({
    addElement: () => {
        return void 0;
    }
});

const VIEW_NAME = "PbWebsiteSettings";

const tracker: Record<string, boolean> = {};

interface GenerateElementsProps {
    name: string;
}
const GenerateElementsComponent: React.VFC<GenerateElementsProps> = ({ name }) => {
    if (tracker[name]) {
        return null;
    }

    tracker[name] = true;

    const ElementsHOC = (Fields: React.VFC): React.VFC => {
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
};

const GenerateElements: React.VFC<GenerateElementsProps> = memo(GenerateElementsComponent);

GenerateElements.displayName = "GenerateElements";

export interface GroupProps {
    name: string;
    querySelection?: DocumentNode;
    label?: string;
    children: React.ReactNode;
}

const Group: React.VFC<GroupProps> = ({ name, label, querySelection, children }) => {
    const viewComposition = useViewComposition();

    const context = useMemo(
        (): GroupContextValue => ({
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

interface ElementProps {
    children: React.ReactNode;
}
const Element: React.VFC<ElementProps> = ({ children }) => {
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
