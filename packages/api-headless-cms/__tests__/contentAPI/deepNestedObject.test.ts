import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { createCarsMutation } from "./deepNestedObject/mutation";
import { createCarsModel } from "./deepNestedObject/model";

const LIST_CARS_QUERY = `
    query ListCarsQuery {
        listCars {
            data {
                id
                carsVehicle
            }
            error {
                message
                code
                data
            }
        }
    }
`;

const GET_CAR_QUERY = `
    query GetCarsQuery($revision: ID!) {
        getCars(revision: $revision) {
            data {
                id
                carsVehicle
            }
            error {
                message
                code
                data
            }
        }
    }
`;

describe("Cars Model Deep Nested Object Fields", () => {
    const handler = useGraphQLHandler({
        plugins: [...createCarsModel()],
        path: "manage/en-US"
    });

    it("should mutate stuff", async () => {
        const [result] = await handler.introspect();

        expect(result).toMatchObject({
            data: {
                __schema: {
                    types: expect.any(Array)
                }
            }
        });

        for (const type of result.data.__schema.types) {
            if (type.name !== "Cars") {
                continue;
            }
            expect(type).toMatchObject({
                name: "Cars",
                kind: "OBJECT"
            });
        }

        const [mutationResult] = await handler.invoke({
            body: {
                query: createCarsMutation(),
                variables: {}
            }
        });

        expect(mutationResult).toEqual({
            data: {
                createCars: {
                    data: {
                        id: expect.any(String),
                        carsVehicle: "Acura-ILX-2019--",
                        vehicleNmb: 709839120181004,
                        carsUid: 7098391,
                        carsDiscontinued: 0,
                        carsMake: "Acura",
                        carsModelName: "ILX",
                        carsYear: 2019,
                        slugMake: "acura",
                        slugModelName: "ilx",
                        slugTrimName: "N/A",
                        baseVehicle: 0,
                        releaseType: "N/A",
                        newUsedBg: "N/A",
                        manufacturerCd: "DE2F3KJW",
                        slugBodystyle: "N/A",
                        makeFeaturedImage: "N/A",
                        makeIcon: "N/A",
                        makeDiscontinued: 0,
                        oemUrl: "N/A",
                        carsSubcategory: "N/A",
                        slugSubcategory: "N/A",
                        mainCategory: "N/A",
                        slugMainCategory: "N/A",
                        hybridElectricCategory: "N/A",
                        slugHybridElectricCategory: "N/A",
                        dieselCategory: "N/A",
                        slugDieselCategory: "N/A",
                        updatedOn: "20211215",
                        vehicleStatus: 0,
                        featuredImage: "N/A",
                        priceRangeText: "N/A",
                        propertyType: "N/A",
                        marketingImage: "N/A",
                        priceRangeValue: 0,
                        ymmPriceRange: "N/A",
                        bodyType: "Sedan",
                        bodyTypeText: "Sedan",
                        bodyTypeOrder: 0,
                        secondaryBodyType: "N/A",
                        secondaryBodyTypeText: "N/A",
                        secondaryBodyTypeOrder: 0,
                        priceRangeSlug: "N/A",
                        latestYear: 0,
                        ymmLowestPriceRange: 0,
                        ymmMaxPriceRange: 0,
                        makeThumbnailUrl: "N/A",
                        combinedPrice: 0,
                        carsCombinedEpaMpg: 0,
                        horsePowerVal: 0,
                        slugMakeModel: "N/A",
                        retainedValue: "N/A",
                        standardTires: "N/A"
                    },
                    error: null
                }
            }
        });

        await handler.until(
            () =>
                handler
                    .invoke({
                        body: {
                            query: LIST_CARS_QUERY
                        }
                    })
                    .then(([data]) => data),
            ({ data }: any) => {
                return data.listCars.data.length > 0;
            }
        );

        const [getResult] = await handler.invoke({
            body: {
                query: GET_CAR_QUERY,
                variables: {
                    revision: mutationResult.data.createCars.data.id
                }
            }
        });
        expect(getResult).toEqual({
            data: {
                getCars: {
                    data: {
                        id: mutationResult.data.createCars.data.id,
                        carsVehicle: "Acura-ILX-2019--"
                    },
                    error: null
                }
            }
        });

        const [listResult] = await handler.invoke({
            body: {
                query: LIST_CARS_QUERY
            }
        });

        expect(listResult).toEqual({
            data: {
                listCars: {
                    data: [
                        {
                            id: mutationResult.data.createCars.data.id,
                            carsVehicle: "Acura-ILX-2019--"
                        }
                    ],
                    error: null
                }
            }
        });
    });
});
