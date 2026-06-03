import { Abstraction } from "@webiny/di";
import { TenantContext } from "../context/TenantContext.js";
import type { ITenantContext } from "../context/TenantContext.js";

export interface IGreetService {
    greet(name: string): string;
}

export const GreetService = new Abstraction<IGreetService>("GreetService");

class GreetServiceImpl implements IGreetService {
    constructor(private tenantCtx: ITenantContext) {}

    greet(name: string) {
        const tenant = this.tenantCtx.require();
        return `Hello, ${name}! (tenant: ${tenant.id})`;
    }
}

export const greetService = GreetService.createImplementation({
    implementation: GreetServiceImpl,
    dependencies: [TenantContext]
});
