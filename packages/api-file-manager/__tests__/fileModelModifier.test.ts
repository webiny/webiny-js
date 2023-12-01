import { useHandler } from "./utils/useHandler";
import { createFileModelModifier } from "~/index";
import { fileAData, fileBData } from "./mocks/files";

describe("File Model Modifier test", () => {
    test("should add custom fields to `extensions` object field", async () => {
        const { handler } = useHandler({
            plugins: [
                createFileModelModifier(({ modifier }) => {
                    modifier.addField({
                        id: "carMake",
                        fieldId: "carMake",
                        label: "Car Make",
                        type: "text"
                    });

                    modifier.addField({
                        id: "year",
                        fieldId: "year",
                        label: "Year of manufacturing",
                        type: "number"
                    });
                })
            ]
        });

        const context = await handler();

        // File A
        await context.fileManager.createFile({
            ...fileAData,
            meta: {},
            extensions: { carMake: "Honda", year: 2018 }
        });

        // File B
        await context.fileManager.createFile({
            ...fileBData,
            meta: {},
            extensions: { carMake: "Volkswagen", year: 2020 }
        });

        const [[file], meta] = await context.fileManager.listFiles({
            where: { extensions: { year_gt: 2018 } }
        });

        expect(file.name).toEqual("filenameB.png");
        expect(file.extensions.year).toEqual(2020);
        expect(meta.totalCount).toEqual(1);
    });
});
