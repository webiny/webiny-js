import { Plugin as BasePlugin } from "@webiny/plugins";
import { Mailer, MailerContext } from "~/types";

interface BuildMailerParams {
    context: MailerContext;
}

interface CreateBuildMailerCallable<T> {
    (params: BuildMailerParams): Promise<T>;
}

export class CreateBuildMailerPlugin<T extends Mailer = Mailer> extends BasePlugin {
    public static override type: string = "mailer.builder.plugin";

    private readonly cb: CreateBuildMailerCallable<T>;

    public constructor(cb: CreateBuildMailerCallable<T>) {
        super();
        this.cb = cb;
    }

    public async buildMailer(params: BuildMailerParams): Promise<T> {
        return this.cb(params);
    }
}

export const createBuildMailerPlugin = <T extends Mailer = Mailer>(
    cb: CreateBuildMailerCallable<T>
) => {
    return new CreateBuildMailerPlugin<T>(cb);
};
