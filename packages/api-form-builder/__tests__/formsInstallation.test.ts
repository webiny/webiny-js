import useGqlHandler from "./useGqlHandler";
import { ContextPlugin } from "@webiny/api";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { FormBuilderContext } from "~/types";

describe('Form Builder "Installation" Test', () => {
    test(`should publish a "tenancy.onTenantAfterInstall" event`, async () => {
        let eventPublished = false;

        const onTenantAfterInstall = new ContextPlugin<TenancyContext>(context => {
            context.tenancy.onTenantAfterInstall.subscribe(() => {
                eventPublished = true;
            });
        });

        const { install } = useGqlHandler({ plugins: [onTenantAfterInstall] });

        const [res] = await install();

        expect(res).toMatchObject({
            data: {
                formBuilder: {
                    install: {
                        data: true,
                        error: null
                    }
                }
            }
        });
        expect(eventPublished).toBe(true);
    });

    test(`should throw if "tenancy.onTenantAfterInstall" event is published more than once`, async () => {
        const onFormsAfterInstall = new ContextPlugin<TenancyContext & FormBuilderContext>(
            context => {
                context.formBuilder.onSystemAfterInstall.subscribe(() => {
                    return context.tenancy.onTenantAfterInstall.publish({});
                });
            }
        );

        const { install } = useGqlHandler({ plugins: [onFormsAfterInstall] });
        const [data] = await install();

        expect(data).toMatchObject({
            data: {
                formBuilder: {
                    install: {
                        data: null,
                        error: {
                            message: `"onTenantAfterInstall" can only be published once!`
                        }
                    }
                }
            }
        });
    });
});
