import React, { useEffect, useMemo } from "react";
import { Grid, Input, Skeleton } from "@webiny/admin-ui";
import { useBind } from "@webiny/form";
import { validation } from "@webiny/validation";
import { createResourcePicker } from "~/ecommerce/createResourcePicker";
import { useEcommerceApi } from "~/ecommerce/features/apis";
import { adaptInputToBind } from "./adaptInputToBind";
import { Resource } from "../types";

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
        name: "resourceId",
        validators: [validation.create("required")]
    });

    const titleBind = useBind({ name: "title", validators: [validation.create("required")] });
    const pathBind = useBind({ name: "path", validators: [validation.create("required")] });

    useEffect(() => {
        return () => {
            titleBind.onChange(undefined);
            pathBind.onChange(undefined);
            resourceIdBind.onChange(undefined);
        };
    }, []);

    useEffect(() => {
        if (!api) {
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
            <Grid.Column span={12}>
                {api ? (
                    <ResourcePicker
                        {...resourceIdBind}
                        label={`Select a ${props.resourceType}`}
                        onChange={onResourceChange}
                    />
                ) : (
                    <Skeleton />
                )}
            </Grid.Column>
            <Grid.Column span={12}>
                <Input label={"Title"} {...titleBind} disabled={!resourceIdBind.value} />
            </Grid.Column>
            <Grid.Column span={12}>
                <Input label={"Path"} {...pathBind} disabled={!resourceIdBind.value} />
            </Grid.Column>
        </>
    );
};
