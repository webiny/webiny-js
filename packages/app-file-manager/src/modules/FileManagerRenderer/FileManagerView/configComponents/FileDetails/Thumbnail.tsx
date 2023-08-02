import { createDecoratorFactory } from "@webiny/app-admin";
import { Thumbnail as ThumbnailComponent } from "~/components/FileDetails/components/Thumbnail";

export const Thumbnail = {
    createDecorator: createDecoratorFactory()(ThumbnailComponent)
};
