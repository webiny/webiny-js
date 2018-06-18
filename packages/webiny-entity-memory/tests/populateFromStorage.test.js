import { ComplexEntity, SimpleEntity } from "./entities/complexEntity";

describe("populateFromStorage test", () => {
    test("should populate entity correctly with data received from memory", async () => {
        SimpleEntity.getDriver()
            .flush("ComplexEntity")
            .import("ComplexEntity", [
                {
                    id: "A",
                    firstName: "test",
                    lastName: "tester",
                    verification: { verified: true, documentType: "driversLicense" },
                    tags: [
                        { slug: "no-name", label: "No Name" },
                        { slug: "adult-user", label: "Adult User" }
                    ],
                    simpleEntity: "A",
                    simpleEntities: ["B", "C", "D"]
                }
            ])
            .flush("SimpleEntity")
            .import("SimpleEntity", [
                {
                    id: "A",
                    name: "Test-A"
                },
                {
                    id: "B",
                    name: "Test-B"
                },
                {
                    id: "C",
                    name: "Test-C"
                },
                {
                    id: "D",
                    name: "Test-D"
                }
            ]);

        const complexEntity = await ComplexEntity.findById("A");

        expect(complexEntity.getAttribute("simpleEntities").value.state).toEqual({
            loading: false,
            loaded: false
        });

        expect(complexEntity.firstName).toEqual("test");
        expect(complexEntity.lastName).toEqual("tester");
        expect(complexEntity.verification.verified).toBe(true);
        expect(complexEntity.verification.documentType).toEqual("driversLicense");
        expect(complexEntity.tags[0].slug).toEqual("no-name");
        expect(complexEntity.tags[0].label).toEqual("No Name");
        expect(complexEntity.tags[1].slug).toEqual("adult-user");
        expect(complexEntity.tags[1].label).toEqual("Adult User");
        expect(complexEntity.tags.length).toBe(2);

        expect(complexEntity.getAttribute("simpleEntities").value.state).toEqual({
            loading: false,
            loaded: false
        });
        expect(complexEntity.getAttribute("simpleEntities").value.getCurrent()[0]).toEqual("B");
        expect(complexEntity.getAttribute("simpleEntities").value.getCurrent()[1]).toEqual("C");
        expect(complexEntity.getAttribute("simpleEntities").value.getCurrent()[2]).toEqual("D");

        expect(complexEntity.getAttribute("simpleEntity").value.getCurrent()).toEqual("A");
        const simpleEntity = await complexEntity.simpleEntity;
        expect(simpleEntity.id).toEqual("A");
        expect(simpleEntity.name).toEqual("Test-A");

        const simpleEntities = await complexEntity.simpleEntities;
        expect(complexEntity.getAttribute("simpleEntities").value.state).toEqual({
            loading: false,
            loaded: true
        });

        expect(simpleEntities.length).toBe(3);

        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[0].id).toEqual("B");
        expect(simpleEntities[0].name).toEqual("Test-B");

        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1].id).toEqual("C");
        expect(simpleEntities[1].name).toEqual("Test-C");

        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2].id).toEqual("D");
        expect(simpleEntities[2].name).toEqual("Test-D");
    });
});
