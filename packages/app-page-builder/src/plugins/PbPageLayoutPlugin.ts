import { Plugin } from "@webiny/plugins";
import { PbPageLayout } from "~/types";

export class PbPageLayoutPlugin extends Plugin {
    public static override readonly type: string = "pb-page-layout";
    public readonly layout: PbPageLayout;

    public constructor(layout: PbPageLayout) {
        super();
        this.layout = layout;
    }
}
