import React, { useEffect } from "react";
import { action, runInAction } from "mobx";
import { observer, useLocalObservable } from "mobx-react-lite";
import capitalize from "lodash/capitalize";
import pluralize from "pluralize";
import {
    ResourcePreviewCell,
    ResourcePreviewCellProps,
    ResourcePicker,
    ResourcePickerProps
} from "./ResourcesPicker";
import { useDialogs } from "@webiny/app-admin";
import { Loader, Button, Text, List } from "@webiny/admin-ui";
import { ReactComponent as Delete } from "@webiny/icons/delete.svg";
import type { IEcommerceApi, Resource } from "~/ecommerce";

export type PickResourceListProps = {
    api: IEcommerceApi;
    value?: string[];
    onChange(newValue: string[]): void;
    resourcePicker?: React.FC<ResourcePickerProps>;
    resourceName: string;
    pluginName: string;
};

const ResourcePreviewById = observer(
    (
        props: {
            id: string;
            api: IEcommerceApi;
            resourceName: string;
            actions?: React.ReactNode;
        } & Partial<ResourcePreviewCellProps>
    ) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...rest } = props;
        const store = useLocalObservable(() => ({
            loading: false,
            resourceInfo: null as Resource | null,
            async getResource() {
                runInAction(() => {
                    this.loading = true;
                });
                try {
                    const value = await props.api[props.resourceName].findById(props.id);
                    runInAction(() => {
                        this.resourceInfo = value;
                    });
                } catch (e) {
                    console.error(e);
                }
                runInAction(() => {
                    this.loading = false;
                });
            }
        }));
        useEffect(() => {
            store.getResource();
        }, []);

        if (store.loading) {
            return <Loader size={"md"} />;
        }

        return (
            (store.resourceInfo && (
                <ResourcePreviewCell resource={store.resourceInfo} {...rest} />
            )) || <React.Fragment></React.Fragment>
        );
    }
);

interface NoResourcesSelectedProps {
    resourceName: string;
}

const NoResourcesSelected = ({ resourceName }: NoResourcesSelectedProps) => {
    return (
        <div className={"wby-w-full"}>
            <Text>There are no {pluralize(resourceName)} in this list.</Text>
        </div>
    );
};

export const PickResourceList = observer((props: PickResourceListProps) => {
    const dialog = useDialogs();

    const store = useLocalObservable(() => ({
        value: props.value || []
    }));

    return (
        <React.Fragment>
            <List>
                {store.value?.map((item, index) => (
                    <ResourcePreviewById
                        resourceName={props.resourceName}
                        key={`${item}:${index}`}
                        id={item}
                        api={props.api}
                        actions={
                            <>
                                <List.Item.Action
                                    icon={<Delete />}
                                    onClick={action(() => {
                                        const res = [
                                            ...store.value!.slice(0, store.value!.indexOf(item)),
                                            ...store.value!.slice(store.value!.indexOf(item) + 1)
                                        ];
                                        store.value = res;
                                        props.onChange(res);
                                    })}
                                />
                            </>
                        }
                    />
                ))}
            </List>
            {(store.value || []).length === 0 ? (
                <NoResourcesSelected resourceName={props.resourceName} />
            ) : null}
            {/* On click - choose product */}
            <div className={"wby-align-center wby-my-lg"}>
                <Button
                    text={`+ Select ${capitalize(pluralize(props.resourceName))}`}
                    variant="secondary"
                    onClick={() => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const { value, resourcePicker, ...rest } = props;
                        const PickerComponent = resourcePicker || ResourcePicker;

                        const closeDialog = dialog.showDialog({
                            title: `Select ${pluralize(props.resourceName)}`,
                            acceptLabel: null,
                            cancelLabel: null,
                            content: (
                                <div className={"wby-h-[500px] wby-overflow-scroll"}>
                                    <PickerComponent
                                        {...rest}
                                        omitIds={store.value}
                                        onChange={action(resource => {
                                            if (resource) {
                                                if (!Array.isArray(store.value)) {
                                                    store.value = [];
                                                }
                                                store.value.push(String(resource.id));
                                                props.onChange(store.value);
                                            }
                                            closeDialog();
                                        })}
                                    />
                                </div>
                            )
                        });
                    }}
                />
            </div>
        </React.Fragment>
    );
});

export const PickResourcesListButton = observer((props: Omit<PickResourceListProps, "onDone">) => {
    const dialogs = useDialogs();

    useEffect(() => {
        if (typeof props.value === "undefined") {
            try {
                props.onChange([]);
            } catch (e) {
                console.warn("Could not set default value", e);
            }
        }
    }, []);

    return (
        <React.Fragment>
            <Button
                text={`${props.value?.length || 0} ${pluralize(
                    props.resourceName,
                    props.value?.length || 0
                )}`}
                variant={"secondary"}
                onClick={() => {
                    dialogs.showDialog({
                        title: `Selected ${pluralize(props.resourceName)}`,
                        acceptLabel: null,
                        cancelLabel: null,
                        content: <PickResourceList {...props} />
                    });
                }}
                style={{ color: "#999", whiteSpace: "nowrap" }}
            />
        </React.Fragment>
    );
});
