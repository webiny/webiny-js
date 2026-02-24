import { ModelFactory } from "~/exports/api/cms/model.js";
import { ListGroupsUseCase } from "~/exports/api/cms/group.js";

class SettingsImpl implements ModelFactory.Interface {
    public constructor(private listGroupsUseCase: ListGroupsUseCase.Interface) {}

    public async execute(builder: ModelFactory.Builder): ModelFactory.Return {
        const groups = await this.listGroupsUseCase.execute();
        if (groups.isFail()) {
            throw new Error(`Could not load groups: ${groups.error.message}`);
        }
        const [group] = groups.value;

        if (!group) {
            throw new Error(`At least one group must exist to create models.`);
        }

        return [
            builder
                .public({
                    name: "Settings",
                    modelId: "settings",
                    group: group.slug,
                    singularApiName: "Setting",
                    pluralApiName: "Settings"
                })
                .singleEntry()
                .description("A model used to store settings.")
        ];
    }
}

const Settings = ModelFactory.createImplementation({
    implementation: SettingsImpl,
    dependencies: [ListGroupsUseCase]
});

export default Settings;
