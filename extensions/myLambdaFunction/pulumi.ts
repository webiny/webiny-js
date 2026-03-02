import { ApiPulumi } from "webiny/infra/api";

class MyApiPulumiHandlerImpl implements ApiPulumi.Interface {
    execute(app: any) {}
}

export default ApiPulumi.createImplementation({
    implementation: MyApiPulumiHandlerImpl,
    dependencies: []
});
