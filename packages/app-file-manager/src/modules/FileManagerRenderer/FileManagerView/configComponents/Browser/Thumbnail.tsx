import { createDecoratorFactory } from "@webiny/app-admin";
import { Thumbnail as ThumbnailComponent } from "~/components/Grid/Thumbnail";

export const Thumbnail = {
    createDecorator: createDecoratorFactory()(ThumbnailComponent)
};
