import { Entity, Driver } from "@webiny/entity";
import { CharAttribute, IntegerAttribute } from "@webiny/model";

describe("overriding ID attribute test", () => {
    test("should have char ID attribute by default", async () => {
        class ExtendedEntityDriver extends Driver {}

        class ExtendedEntity extends Entity {}
        ExtendedEntity.driver = new ExtendedEntityDriver();

        const entity = new ExtendedEntity();
        expect(entity.getAttribute("id")).toBeInstanceOf(CharAttribute);
    });

    test("should have ID attribute overridden by driver", async () => {
        class ExtendedEntityDriver extends Driver {
            onEntityConstruct(entity) {
                entity.attr("id").integer();
            }
        }

        class ExtendedEntity extends Entity {}
        ExtendedEntity.driver = new ExtendedEntityDriver();

        const entity = new ExtendedEntity();
        expect(entity.getAttribute("id")).toBeInstanceOf(IntegerAttribute);
    });
});
