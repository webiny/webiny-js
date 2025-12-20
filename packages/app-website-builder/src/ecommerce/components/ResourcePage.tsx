import React, { useEffect, useMemo } from "react";
import { Grid, Input, Skeleton } from "@webiny/admin-ui";
import { UnsetOnUnmount, useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { createResourcePicker } from "~/ecommerce/createResourcePicker.js";
import { adaptInputToBind } from "./adaptInputToBind.js";
import type { Resource } from "../types.js";
import { toTitleCaseLabel } from "~/ecommerce/components/toTitleCaseLabel.js";
import { useEcommerceApi } from "~/features/index.js";

export interface ResourcePageProps {
    apiName: string;
    name: string;
    label: string;
    resourceType: string;
    previewPath: (resource: Resource) => string;
}

export const ResourcePage = (props: ResourcePageProps) => {
    const { api } = useEcommerceApi(props.apiName);

    const ResourcePicker = useMemo(() => {
        if (!api) {
            return () => null;
        }

        const ElementInput = createResourcePicker(props.apiName, api, props.resourceType);
        return adaptInputToBind(ElementInput);
    }, [api]);

    const resourceIdBind = useBind({
        name: "metadata.resourceId",
        validators: [validation.create("required")]
    });

    const resourceTypeBind = useBind({
        name: "metadata.resourceType",
        defaultValue: props.resourceType
    });

    const titleBind = useBind({
        name: "properties.title",
        validators: [validation.create("required")]
    });

    const pathBind = useBind({
        name: "properties.path",
        validators: [validation.create("required")]
    });

    useEffect(() => {
        if (!api || !resourceIdBind) {
            return;
        }

        if (resourceIdBind.value) {
            api[props.resourceType].findById(resourceIdBind.value).then(resource => {
                titleBind.onChange(resource.title);
                pathBind.onChange(props.previewPath(resource));
            });
        }
    }, [resourceIdBind.value]);

    const onResourceChange = (resource: Resource) => {
        resourceIdBind.onChange(resource);
    };

    return (
        <>
            <UnsetOnUnmount name={"metadata.resourceType"}>
                <Input {...resourceTypeBind} className={"hidden"} />
            </UnsetOnUnmount>
            <Grid.Column span={12}>
                <div className={"border-sm rounded-md border-neutral-muted p-sm"}>
                    {api ? (
                        <UnsetOnUnmount name={"metadata.resourceId"}>
                            <ResourcePicker
                                {...resourceIdBind}
                                label={toTitleCaseLabel(props.resourceType)}
                                onChange={onResourceChange}
                            />
                        </UnsetOnUnmount>
                    ) : (
                        <Skeleton />
                    )}
                </div>
            </Grid.Column>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.title"}>
                    <Input label={"Title"} {...titleBind} disabled={!resourceIdBind.value} />
                </UnsetOnUnmount>
            </Grid.Column>
            <Grid.Column span={12}>
                <UnsetOnUnmount name={"properties.path"}>
                    <Input label={"Path"} {...pathBind} disabled={!resourceIdBind.value} />
                </UnsetOnUnmount>
            </Grid.Column>
        </>
    );
};
