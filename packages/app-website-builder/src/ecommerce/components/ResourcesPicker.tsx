import React, { useEffect } from "react";
import { runInAction, action } from "mobx";
import { observer, useLocalObservable } from "mobx-react-lite";
import pluralize from "pluralize";
import throttle from "lodash/throttle";
import { useDialogs } from "@webiny/app-admin";
import {
    Avatar,
    Button,
    Loader,
    List,
    Input,
    Text,
    DelayedOnChange,
    useToast
} from "@webiny/admin-ui";
import { Resource } from "../types";
import { CustomResourcePickerProps } from "~/ecommerce";

export interface CommerceAPIOperations {
    [resourceName: string]: {
        resourcePicker?: React.FC<ResourcePickerProps>;
        findById(id: string): Promise<Resource>;
        findByHandle?(handle: string): Promise<Resource>;
        search(search: string, offset?: number, limit?: number): Promise<Resource[]>;
        getRequestObject(id: string, resource?: Resource): string;
    };
}

export interface ResourcesPickerButtonProps extends CustomResourcePickerProps<string> {
    api: CommerceAPIOperations;
    resourcePicker?: React.FC<ResourcePickerProps>;
    pluginName: string;
    resourceName: string;
}

export interface ResourcePreviewCellProps {
    resource: Resource;
    actions?: React.ReactNode;
    selected?: boolean;
    className?: string;
    onClick?: () => void;
    style?: Partial<CSSStyleDeclaration>;
}

export const ResourcePreviewCell = observer((props: ResourcePreviewCellProps) => {
    return (
        <List.Item
            onClick={props.onClick}
            title={
                props.resource.title !== "untitled" ? (
                    <div>
                        {props.resource.title} - {props.resource.id}
                    </div>
                ) : (
                    props.resource.title
                )
            }
            className={props.className}
            selected={props.selected}
            icon={
                props.resource.image ? (
                    <Avatar
                        variant={"subtle"}
                        image={
                            <Avatar.Image
                                src={props.resource.image.src}
                                alt={props.resource.title}
                            />
                        }
                    />
                ) : undefined
            }
            actions={props.actions ?? <></>}
        />
    );
});

export type ResourcePickerProps = CustomResourcePickerProps<Resource> & {
    api: CommerceAPIOperations;
    resourceName: string;
    omitIds?: string[];
    title?: string;
};

export const ResourcePicker = observer((props: ResourcePickerProps) => {
    const { showToast } = useToast();

    const store = useLocalObservable(() => ({
        searchInputText: "",
        loading: false,
        resources: [] as Resource[],
        search: throttle(async () => {
            runInAction(() => {
                store.loading = true;
            });
            const catchError = (err: any) => {
                console.error("search error:", err);
                showToast({
                    title: `Failed to load ${props.resourceName}s!`,
                    description: `We were unable to get ${props.resourceName}s from the remote API.`
                });
            };

            const resourcesResponse = await props.api[props.resourceName]
                .search(store.searchInputText)
                .catch(catchError);

            runInAction(() => {
                if (Array.isArray(resourcesResponse)) {
                    store.resources = resourcesResponse;
                }
                store.loading = false;
            });
        }, 400)
    }));

    useEffect(() => {
        store.search();
    }, [store.searchInputText]);

    return (
        <div style={{ display: "flex", flexDirection: "column", overflow: "scroll" }}>
            <DelayedOnChange<string>
                value={store.searchInputText}
                onChange={action(value => (store.searchInputText = value))}
            >
                <Input
                    placeholder={props.title || `Search ${pluralize.plural(props.resourceName)}...`}
                />
            </DelayedOnChange>
            {store.loading && <Loader style={{ margin: "50px auto" }} />}
            <div>
                {!store.loading &&
                    (store.resources.length ? (
                        store.resources.map(item => (
                            <List
                                key={item.id}
                                onClick={() => {
                                    props.onChange(item);
                                }}
                            >
                                <ResourcePreviewCell
                                    selected={String(item.id) === String(props.value?.id)}
                                    resource={item}
                                    key={item.id}
                                />
                            </List>
                        ))
                    ) : (
                        <div style={{ margin: "40px 20px", textAlign: "center" }}>
                            <Text size={"md"}>
                                No {pluralize.plural(props.resourceName)} found.
                            </Text>
                        </div>
                    ))}
            </div>
        </div>
    );
});

export const ResourcesPickerButton: React.FC<ResourcesPickerButtonProps> = observer(props => {
    const { showToast } = useToast();
    const dialog = useDialogs();

    const store = useLocalObservable(() => ({
        loading: false,
        error: null,
        resourceInfo: null as Resource | null,
        resourceId: props.value,
        updateResourceId(newProps: ResourcesPickerButtonProps) {
            this.resourceId = newProps.value;
        },
        async getResource() {
            runInAction(() => {
                this.error = null;
                this.loading = true;
            });

            try {
                const resourceService = props.api[props.resourceName];
                const value = this.resourceId && (await resourceService.findById(this.resourceId));
                runInAction(() => {
                    this.resourceInfo = value || null;
                });
            } catch (e) {
                console.error(e);
                runInAction(() => {
                    this.error = e as any;
                });
                showToast({
                    title: `Failed to load ${props.resourceName}!`,
                    description: `We were unable to get ${props.resourceName} from the remote API.`
                });
            }
            runInAction(() => {
                this.loading = false;
            });
        },
        async showPickResourceModal(title?: string) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { value, resourcePicker, ...rest } = props;
            const PickerComponent = resourcePicker || ResourcePicker;

            const closeDialog = dialog.showDialog({
                title: `Select a ${props.resourceName}`,
                acceptLabel: null,
                cancelLabel: null,
                content: (
                    <div className={"wby-h-[500px] wby-overflow-scroll"}>
                        <PickerComponent
                            {...rest}
                            resourceName={props.resourceName}
                            {...(this.resourceInfo && { value: this.resourceInfo })}
                            title={title}
                            onChange={action(value => {
                                if (value) {
                                    this.resourceId = String(value.id);
                                    this.getResource();
                                    props.onChange(
                                        props.api[props.resourceName].getRequestObject(
                                            this.resourceId,
                                            value
                                        )
                                    );
                                    closeDialog();
                                }
                            })}
                        />
                    </div>
                )
            });
        }
    }));

    useEffect(() => {
        store.updateResourceId(props);
        store.getResource();
    }, [props.value]);

    return (
        <div style={{ display: "flex", flexDirection: "column", padding: "10px 0" }}>
            {store.loading && <Loader size={"md"} style={{ margin: "30px auto" }} />}
            {store.resourceInfo && !store.loading && (
                <div className={"wby-relative"}>
                    <ResourcePreviewCell
                        style={{ paddingRight: "30px" }}
                        resource={store.resourceInfo}
                        onClick={() => {
                            store.showPickResourceModal();
                        }}
                    />
                </div>
            )}
            {!store.resourceInfo && !store.loading && (
                <Button
                    color="primary"
                    variant="secondary"
                    onClick={() => {
                        store.showPickResourceModal();
                    }}
                    text={`Choose ${props.resourceName}`}
                />
            )}
        </div>
    );
});
