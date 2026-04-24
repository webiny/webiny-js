import type { CmsModelCreateInput } from "@webiny/api-headless-cms/types/index.js";
import type { CmsGroup } from "@webiny/api-headless-cms/types/index.js";
import { CARS_MODEL_ID } from "./constants.js";
import { createModelField } from "@webiny/api-headless-cms";

export const createCarsModel = (group: CmsGroup): CmsModelCreateInput => {
    return {
        name: "Cars",
        modelId: CARS_MODEL_ID,
        singularApiName: "Cars",
        pluralApiName: "Cars",
        description: "Cars Data Model",
        group: group.id,
        fields: [
            createModelField({
                id: "carsVehicle",
                fieldId: "carsVehicle",
                type: "text",
                label: "Vehicle",
                help: "Make Model Year and Trim",
                renderer: {
                    name: "text-input"
                },
                validation: [
                    {
                        name: "required",
                        message: "Value is required."
                    }
                ]
            }),
            createModelField({
                id: "vehicleNmb",
                fieldId: "vehicleNmb",
                type: "number",
                label: "VehicleNumber",
                help: "A unique vehicle number",
                renderer: {
                    name: "number-input"
                },
                validation: [
                    {
                        name: "required",
                        message: "Value is required."
                    }
                ]
            }),
            createModelField({
                id: "carsYear",
                fieldId: "carsYear",
                type: "number",
                label: "Year",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "carsMake",
                fieldId: "carsMake",
                type: "text",
                label: "Make",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "carsModelName",
                fieldId: "carsModelName",
                type: "text",
                label: "ModelName",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "trimName",
                fieldId: "trimName",
                type: "text",
                label: "TrimName",
                list: false,
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "bodyStyle",
                fieldId: "bodyStyle",
                list: false,
                type: "text",
                label: "BodyStyle",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "manufacturerCd",
                fieldId: "manufacturerCd",
                type: "text",
                label: "Manufacturer Code",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "releaseType",
                fieldId: "releaseType",
                type: "text",
                label: "ReleaseType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "newUsedBg",
                fieldId: "newUsedBg",
                type: "text",
                label: "NewUsedBg (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "carsUid",
                fieldId: "carsUid",
                type: "number",
                label: "UID",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "carsDiscontinued",
                fieldId: "carsDiscontinued",
                type: "number",
                label: "Discontinued",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "slugMake",
                fieldId: "slugMake",
                type: "text",
                label: "Slug Make",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugModelName",
                fieldId: "slugModelName",
                type: "text",
                label: "SlugModelName",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugTrimName",
                fieldId: "slugTrimName",
                type: "text",
                label: "SlugTrimName (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugBodystyle",
                fieldId: "slugBodystyle",
                type: "text",
                label: "SlugBodystyle (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "makeFeaturedImage",
                fieldId: "makeFeaturedImage",
                type: "text",
                label: "MakeFeaturedImage (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "makeIcon",
                fieldId: "makeIcon",
                type: "text",
                label: "MakeIcon (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "makeDiscontinued",
                fieldId: "makeDiscontinued",
                type: "number",
                label: "Make Discontinued",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "baseVehicle",
                fieldId: "baseVehicle",
                type: "number",
                label: "BaseVehicle (non-jato)",
                renderer: {
                    name: "number-input"
                },
                help: "This is a Required Field."
            }),
            createModelField({
                id: "oemUrl",
                fieldId: "oemUrl",
                type: "text",
                label: "OemUrl (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "carsSubcategory",
                fieldId: "carsSubcategory",
                type: "text",
                label: "Subcategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugSubcategory",
                fieldId: "slugSubcategory",
                type: "text",
                label: "SlugSubcategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "mainCategory",
                fieldId: "mainCategory",
                type: "text",
                label: "MainCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugMainCategory",
                fieldId: "slugMainCategory",
                type: "text",
                label: "SlugMainCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "hybridElectricCategory",
                fieldId: "hybridElectricCategory",
                type: "text",
                label: "HybridElectricCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugHybridElectricCategory",
                fieldId: "slugHybridElectricCategory",
                type: "text",
                label: "SlugHybridElectricCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "dieselCategory",
                fieldId: "dieselCategory",
                type: "text",
                label: "DieselCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugDieselCategory",
                fieldId: "slugDieselCategory",
                type: "text",
                label: "SlugDieselCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "updatedOn",
                fieldId: "updatedOn",
                type: "text",
                label: "UpdatedOn",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "vehicleStatus",
                fieldId: "vehicleStatus",
                type: "number",
                label: "VehicleStatus (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "featuredImage",
                fieldId: "featuredImage",
                type: "text",
                label: "FeaturedImage (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "propertyType",
                fieldId: "propertyType",
                type: "text",
                label: "PropertyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "marketingImage",
                fieldId: "marketingImage",
                type: "text",
                label: "MarketingImage (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "priceRangeValue",
                fieldId: "priceRangeValue",
                type: "number",
                label: "PriceRangeValue (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "priceRangeText",
                fieldId: "priceRangeText",
                type: "text",
                label: "PriceRangeText (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "ymmPriceRange",
                fieldId: "ymmPriceRange",
                type: "text",
                label: "YMMPriceRange (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "bodyType",
                fieldId: "bodyType",
                type: "text",
                label: "BodyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "bodyTypeText",
                fieldId: "bodyTypeText",
                type: "text",
                label: "BodyType Text (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugBodyType",
                fieldId: "slugBodyType",
                type: "text",
                label: "SlugBodyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "bodyTypeOrder",
                fieldId: "bodyTypeOrder",
                type: "number",
                label: "BodyTypeOrder (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "secondaryBodyType",
                fieldId: "secondaryBodyType",
                type: "text",
                label: "SecondaryBodyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "secondaryBodyTypeText",
                fieldId: "secondaryBodyTypeText",
                type: "text",
                label: "SecondaryBodyTypeText (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugSecondaryBodyType",
                fieldId: "slugSecondaryBodyType",
                type: "text",
                label: "SlugSecondaryBodyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "secondaryBodyTypeOrder",
                fieldId: "secondaryBodyTypeOrder",
                type: "number",
                label: "SecondaryBodyTypeOrder (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "priceRangeSlug",
                fieldId: "priceRangeSlug",
                type: "text",
                label: "PriceRangeSlug (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "latestYear",
                fieldId: "latestYear",
                type: "number",
                label: "LatestYear (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "ymmLowestPriceRange",
                fieldId: "ymmLowestPriceRange",
                type: "number",
                label: "YMMLowestPriceRange (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "ymmMaxPriceRange",
                fieldId: "ymmMaxPriceRange",
                type: "number",
                label: "YMMMaxPriceRange (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "makeThumbnailUrl",
                fieldId: "makeThumbnailUrl",
                type: "text",
                label: "MakeThumbnailUrl (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "combinedPrice",
                fieldId: "combinedPrice",
                type: "number",
                label: "CombinedPrice (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "carsCombinedEpaMpg",
                fieldId: "carsCombinedEpaMpg",
                type: "number",
                label: "CombinedEpaMPG (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "horsePowerVal",
                fieldId: "horsePowerVal",
                type: "number",
                label: "HorsePowerVal (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "slugMakeModel",
                fieldId: "slugMakeModel",
                type: "text",
                label: "SlugMakeModel (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "slugYearMakeModel",
                fieldId: "slugYearMakeModel",
                type: "text",
                label: "SlugYearMakeModel (non-jato)",
                renderer: {
                    name: "text-input"
                },
                help: "This is a Required Field."
            }),
            createModelField({
                id: "retainedValue",
                fieldId: "retainedValue",
                type: "text",
                label: "RetainedValue (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "standardTires",
                fieldId: "standardTires",
                type: "text",
                label: "StandardTires (non-jato)",
                renderer: {
                    name: "text-input"
                }
            }),
            createModelField({
                id: "carsMakePageShow",
                fieldId: "carsMakePageShow",
                type: "number",
                label: "Make Page Show (non-jato)",
                renderer: {
                    name: "number-input"
                },
                help: "This is a Required Field."
            }),
            createModelField({
                id: "carsPricePageShow",
                fieldId: "carsPricePageShow",
                type: "number",
                label: "PriceRange Page Show (non-jato)",
                renderer: {
                    name: "number-input"
                },
                help: "This is a Required Field."
            }),
            createModelField({
                id: "carsEditorialRating",
                fieldId: "editorialRating",
                type: "number",
                label: "Editorial Rating (non-jato)",
                renderer: {
                    name: "number-input"
                }
            }),
            createModelField({
                id: "specifications",
                fieldId: "specifications",
                type: "object",
                label: "Specifications",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["seatingCapacity", "specWidth", "specLength", "driveTrain"],
                        ["specHeight", "specWheelase", "frontHeadroom"],
                        ["rearHeadroom", "frontShoulderRoom", "rearShoulderRoom"],
                        ["frontLegroom", "rearLegroom", "groundClearance"],
                        ["curbWeight", "cargoCapacity", "specGvwr"],
                        ["engineName", "specHorsepower", "specTonnage"],
                        ["specTorque", "fuelType", "fuelCapacity", "stdEpaMpg"],
                        ["transmissionName", "transmissionType", "towingCapacity"],
                        ["drivingRange", "cylinderConfiguration", "numberOfCylinders"],
                        ["stdMpgWithUnits", "heroLabel1", "heroValue1"],
                        ["payloadCapacity", "vehicleClass", "engineType"]
                    ],
                    fields: [
                        createModelField({
                            id: "driveTrain",
                            fieldId: "driveTrain",
                            list: false,
                            type: "text",
                            label: "Drivetrain",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "seatingCapacity",
                            fieldId: "seatingCapacity",
                            list: false,
                            type: "text",
                            label: "SeatingCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "specWidth",
                            fieldId: "specWidth",
                            list: false,
                            type: "text",
                            label: "Width",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "specLength",
                            fieldId: "specLength",
                            list: false,
                            type: "text",
                            label: "Length",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "specHeight",
                            fieldId: "specHeight",
                            list: false,
                            type: "text",
                            label: "Height",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "specWheelase",
                            fieldId: "specWheelbase",
                            type: "text",
                            list: false,
                            label: "Wheelbase",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "frontHeadroom",
                            fieldId: "frontHeadroom",
                            type: "text",
                            list: false,
                            label: "FrontHeadroom",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "rearHeadroom",
                            fieldId: "rearHeadroom",
                            type: "text",
                            list: false,
                            label: "RearHeadroom",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "frontShoulderRoom",
                            fieldId: "frontShoulderRoom",
                            type: "text",
                            list: false,
                            label: "FrontShoulderRoom",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "rearShoulderRoom",
                            fieldId: "rearShoulderRoom",
                            type: "text",
                            list: false,
                            label: "RearShoulderRoom",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "frontLegroom",
                            fieldId: "frontLegroom",
                            type: "text",
                            list: false,
                            label: "FrontLegroom",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "rearLegroom",
                            fieldId: "rearLegroom",
                            type: "text",
                            list: false,
                            label: "RearLegroom",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "groundClearance",
                            fieldId: "groundClearance",
                            type: "text",
                            list: false,
                            label: "GroundClearance",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "curbWeight",
                            fieldId: "curbWeight",
                            type: "text",
                            list: false,
                            label: "CurbWeight",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cargoCapacity",
                            fieldId: "cargoCapacity",
                            type: "text",
                            list: false,
                            label: "CargoCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "specGvwr",
                            fieldId: "specGvwr",
                            type: "text",
                            list: false,
                            label: "GVWR",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "payloadCapacity",
                            fieldId: "payloadCapacity",
                            type: "text",
                            list: false,
                            label: "PayloadCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "towingCapacity",
                            fieldId: "towingCapacity",
                            type: "text",
                            list: false,
                            label: "TowingCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "engineName",
                            fieldId: "engineName",
                            type: "text",
                            list: false,
                            label: "EngineName",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "specHorsepower",
                            fieldId: "specHorsepower",
                            type: "text",
                            list: false,
                            label: "Horsepower",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "specTorque",
                            fieldId: "specTorque",
                            type: "text",
                            list: false,
                            label: "Torque",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "fuelType",
                            fieldId: "fuelType",
                            list: false,
                            type: "text",
                            label: "FuelType",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "fuelCapacity",
                            fieldId: "fuelCapacity",
                            list: false,
                            type: "text",
                            label: "FuelCapacity (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "stdEpaMpg",
                            fieldId: "stdEpaMpg",
                            type: "text",
                            list: false,
                            label: "StdEpaMpg",
                            renderer: {
                                name: "text-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "transmissionName",
                            fieldId: "transmissionName",
                            type: "text",
                            list: false,
                            label: "TransmissionName",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "transmissionType",
                            fieldId: "transmissionType",
                            type: "text",
                            list: false,
                            label: "TransmissionType",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "drivingRange",
                            fieldId: "drivingRange",
                            type: "text",
                            list: false,
                            label: "DrivingRange",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cylinderConfiguration",
                            fieldId: "cylinderConfiguration",
                            type: "text",
                            list: false,
                            label: "CylinderConfiguration",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "numberOfCylinders",
                            fieldId: "numberOfCylinders",
                            type: "text",
                            list: false,
                            label: "NumberOfCylinders",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "specTonnage",
                            fieldId: "specTonnage",
                            type: "text",
                            list: false,
                            label: "Tonnage (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "stdMpgWithUnits",
                            fieldId: "stdMpgWithUnits",
                            type: "text",
                            list: false,
                            label: "StdMpg With Units (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "heroLabel1",
                            fieldId: "heroLabel1",
                            type: "text",
                            list: false,
                            label: "Hero Label1 (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "heroValue1",
                            fieldId: "heroValue1",
                            type: "text",
                            list: false,
                            label: "Hero Value1 (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "vehicleClass",
                            fieldId: "vehicleClass",
                            type: "text",
                            list: false,
                            label: "VehicleClass (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "engineType",
                            fieldId: "engineType",
                            type: "text",
                            list: false,
                            label: "Engine Type (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "powertrains",
                fieldId: "powertrains",
                list: true,
                label: "Powertrains (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [["ptHorseower", "ptCityMpg", "ptHwyMpg"]],
                    fields: [
                        createModelField({
                            id: "ptHorseower",
                            fieldId: "ptHorseower",
                            type: "number",
                            list: false,
                            label: "Horsepower",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "ptCityMpg",
                            fieldId: "ptCityMpg",
                            type: "number",
                            list: false,
                            label: "CityMpg",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "ptHwyMpg",
                            fieldId: "ptHwyMpg",
                            type: "number",
                            list: false,
                            label: "HwyMpg",
                            renderer: {
                                name: "number-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "warranty",
                fieldId: "warranty",
                type: "object",
                label: "Warranty",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["fullWarrantyMiles", "fullWarrantyMonths", "powertrainWarrantyMiles"],
                        [
                            "powertrainWarrantyMonths",
                            "maintenanceWarrantyMiles",
                            "maintenanceWarrantyMonths"
                        ],
                        ["roadsideWarrantyMiles", "roadsideWarrantyMonths"],
                        ["corrosionWarrantyMiles", "corrosionWarrantyMonths"]
                    ],
                    fields: [
                        createModelField({
                            id: "fullWarrantyMiles",
                            fieldId: "fullWarrantyMiles",
                            type: "text",
                            list: false,
                            label: "FullWarrantyMiles",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "fullWarrantyMonths",
                            fieldId: "fullWarrantyMonths",
                            type: "text",
                            list: false,
                            label: "FullWarrantyMonths",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "powertrainWarrantyMiles",
                            fieldId: "powertrainWarrantyMiles",
                            type: "text",
                            list: false,
                            label: "PowertrainWarrantyMiles",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "powertrainWarrantyMonths",
                            fieldId: "powertrainWarrantyMonths",
                            type: "text",
                            list: false,
                            label: "PowertrainWarrantyMonths",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "maintenanceWarrantyMiles",
                            fieldId: "maintenanceWarrantyMiles",
                            type: "text",
                            list: false,
                            label: "MaintenanceWarrantyMiles (non-jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "maintenanceWarrantyMonths",
                            fieldId: "maintenanceWarrantyMonths",
                            type: "text",
                            list: false,
                            label: "MaintenanceWarrantyMonths (non-jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "roadsideWarrantyMiles",
                            fieldId: "roadsideWarrantyMiles",
                            type: "text",
                            list: false,
                            label: "RoadsideWarrantyMiles",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "roadsideWarrantyMonths",
                            fieldId: "roadsideWarrantyMonths",
                            type: "text",
                            list: false,
                            label: "RoadsideWarrantyMonths",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "corrosionWarrantyMiles",
                            fieldId: "corrosionWarrantyMiles",
                            type: "text",
                            list: false,
                            label: "CorrosionWarrantyMiles",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "corrosionWarrantyMonths",
                            fieldId: "corrosionWarrantyMonths",
                            type: "text",
                            list: false,
                            label: "CorrosionWarrantyMonths",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "pricing",
                fieldId: "pricing",
                type: "object",
                label: "Pricing",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["pInvoice", "pMsrp", "pDestination"],
                        ["pEffectiveOn", "pTargetPrice", "pTotalTargetPrice"],
                        ["pAverageSalesTaxAndFees", "pGasGuzzlerTax", "pTargetRebate"],
                        ["pNewMonthly", "pCpoPrice", "pExcellentRetailValue"],
                        ["pMsrpLabel", "pMsrpValue", "pFmpOrCrvLabel"],
                        ["pFmpOrCrvValue"]
                    ],
                    fields: [
                        createModelField({
                            id: "pInvoice",
                            fieldId: "pInvoice",
                            type: "number",
                            list: false,
                            label: "Invoice",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pMsrp",
                            fieldId: "pMsrp",
                            type: "number",
                            list: false,
                            label: "MSRP",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pDestination",
                            fieldId: "pDestination",
                            type: "number",
                            list: false,
                            label: "Destination",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pEffectiveOn",
                            fieldId: "pEffectiveOn",
                            type: "text",
                            list: false,
                            label: "PriceEffectiveOn",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "pTargetPrice",
                            fieldId: "pTargetPrice",
                            type: "number",
                            list: false,
                            label: "Target Price(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pTotalTargetPrice",
                            fieldId: "pTotalTargetPrice",
                            type: "number",
                            list: false,
                            label: "Total TargetPrice(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pAverageSalesTaxAndFees",
                            fieldId: "pAverageSalesTaxAndFees",
                            type: "number",
                            list: false,
                            label: "AverageSalesTaxAndFees(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pGasGuzzlerTax",
                            fieldId: "pGasGuzzlerTax",
                            type: "number",
                            list: false,
                            label: "GasGuzzlerTax(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pTargetRebate",
                            fieldId: "pTargetRebate",
                            type: "number",
                            list: false,
                            label: "Target Rebate(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pNewMonthly",
                            fieldId: "pNewMonthly",
                            type: "number",
                            list: false,
                            label: "NewMonthly(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pCpoPrice",
                            fieldId: "pCpoPrice",
                            type: "text",
                            list: false,
                            label: "CpoPrice(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "pExcellentRetailValue",
                            fieldId: "pExcellentRetailValue",
                            type: "number",
                            list: false,
                            label: "ExcellentRetailValue(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "pMsrpLabel",
                            fieldId: "pMsrpLabel",
                            type: "text",
                            list: false,
                            label: "MsrpLabel(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "pMsrpValue",
                            fieldId: "pMsrpValue",
                            type: "text",
                            list: false,
                            label: "MsrpValue(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "pFmpOrCrvLabel",
                            fieldId: "pFmpOrCrvLabel",
                            type: "text",
                            list: false,
                            label: "FmpOrCrvLabel(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "pFmpOrCrvValue",
                            fieldId: "pFmpOrCrvValue",
                            type: "text",
                            list: false,
                            label: "FmpOrCrvValue(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "safetyRatings",
                fieldId: "safetyRatings",
                type: "object",
                label: "SafetyRatings",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["nhtsaRatingOverall", "nhtsaRatingRollover", "nhtsaRatingFrontDriver"],
                        [
                            "nhtsaRatingFrontPassenger",
                            "nhtsaRatingFrontSide",
                            "nhtsaRatingRearSide"
                        ],
                        ["iihsFrontModerateOverlap", "iihsOverallSideCrash", "iihsBestPick"],
                        ["iihsRearCrash", "iihsRoofStrength", "iihsFrontSmallOverlap"]
                    ],
                    fields: [
                        createModelField({
                            id: "nhtsaRatingOverall",
                            fieldId: "nhtsaRatingOverall",
                            type: "text",
                            list: false,
                            label: "NhtsaRatingOverall",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "nhtsaRatingRollover",
                            fieldId: "nhtsaRatingRollover",
                            type: "text",
                            list: false,
                            label: "NhtsaRatingRollover",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "nhtsaRatingFrontDriver",
                            fieldId: "nhtsaRatingFrontDriver",
                            type: "text",
                            list: false,
                            label: "NhtsaRatingFrontDriver (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "nhtsaRatingFrontPassenger",
                            fieldId: "nhtsaRatingFrontPassenger",
                            type: "text",
                            list: false,
                            label: "NhtsaRatingFrontPassenger (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "nhtsaRatingFrontSide",
                            fieldId: "nhtsaRatingFrontSide",
                            type: "text",
                            list: false,
                            label: "NhtsaRatingFrontSide (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "nhtsaRatingRearSide",
                            fieldId: "nhtsaRatingRearSide",
                            type: "text",
                            list: false,
                            label: "NhtsaRatingRearSide (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "iihsFrontModerateOverlap",
                            fieldId: "iihsFrontModerateOverlap",
                            type: "text",
                            list: false,
                            label: "IihsFrontModerateOverlap (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "iihsOverallSideCrash",
                            fieldId: "iihsOverallSideCrash",
                            type: "text",
                            list: false,
                            label: "IihsOverallSideCrash (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "iihsBestPick",
                            fieldId: "iihsBestPick",
                            type: "text",
                            list: false,
                            label: "IihsBestPick (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "iihsRearCrash",
                            fieldId: "iihsRearCrash",
                            type: "text",
                            list: false,
                            label: "IihsRearCrash (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "iihsRoofStrength",
                            fieldId: "iihsRoofStrength",
                            type: "text",
                            list: false,
                            label: "IihsRoofStrength (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "iihsFrontSmallOverlap",
                            fieldId: "iihsFrontSmallOverlap",
                            type: "text",
                            list: false,
                            label: "IihsFrontSmallOverlap (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "ownershipCosts",
                fieldId: "ownershipCosts",
                type: "object",
                label: "Ownership Costs (Non-Jato)",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["depreciationTotal", "financingTotal", "insuranceTotal"],
                        ["stateFeesTotal", "fuelTotal", "maintenanceTotal"],
                        ["repairsTotal", "total5YearOcCost", "total5YearOcCostLessHybrid"],
                        ["similarVehicles", "difference5YearCost", "hybridTax"],
                        ["valueRating"]
                    ],
                    fields: [
                        createModelField({
                            id: "depreciationTotal",
                            fieldId: "depreciationTotal",
                            type: "text",
                            list: false,
                            label: "DepreciationTotal",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "financingTotal",
                            fieldId: "financingTotal",
                            type: "text",
                            list: false,
                            label: "FinancingTotal",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "insuranceTotal",
                            fieldId: "insuranceTotal",
                            type: "text",
                            list: false,
                            label: "InsuranceTotal",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "stateFeesTotal",
                            fieldId: "stateFeesTotal",
                            type: "text",
                            list: false,
                            label: "StateFeesTotal",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "fuelTotal",
                            fieldId: "fuelTotal",
                            type: "text",
                            list: false,
                            label: "FuelTotal",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "maintenanceTotal",
                            fieldId: "maintenanceTotal",
                            type: "text",
                            list: false,
                            label: "MaintenanceTotal",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "repairsTotal",
                            fieldId: "repairsTotal",
                            type: "text",
                            list: false,
                            label: "RepairsTotal",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "total5YearOcCost",
                            fieldId: "total5YearOcCost",
                            type: "text",
                            list: false,
                            label: "Total5YearOcCost",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "total5YearOcCostLessHybrid",
                            fieldId: "total5YearOcCostLessHybrid",
                            type: "number",
                            list: false,
                            label: "Total5YearOcCostLessHybrid",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "similarVehicles",
                            fieldId: "similarVehicles",
                            type: "number",
                            list: false,
                            label: "SimilarVehicles",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "difference5YearCost",
                            fieldId: "difference5YearCost",
                            type: "number",
                            list: false,
                            label: "Difference5YearCost",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "hybridTax",
                            fieldId: "hybridTax",
                            type: "text",
                            list: false,
                            label: "HybridTax",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "valueRating",
                            fieldId: "valueRating",
                            type: "text",
                            list: false,
                            label: "ValueRating",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "cpoComparison",
                fieldId: "cpoComparison",
                type: "object",
                label: "CPOComparison (Non-Jato)",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["usedMonthly", "cpoMonthly", "usedMaintenanceRepairs"],
                        ["cpoMaintenanceRepairs", "usedTotalMonthly", "cpoTotalMonthly"],
                        ["cpoYear", "cpoMake", "modelName"],
                        ["usedCarTrim", "cpoPrice", "usedCarPrice"],
                        ["vehicleRating"]
                    ],
                    fields: [
                        createModelField({
                            id: "usedMonthly",
                            fieldId: "usedMonthly",
                            type: "number",
                            list: false,
                            label: "UsedMonthly",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "cpoMonthly",
                            fieldId: "cpoMonthly",
                            type: "number",
                            list: false,
                            label: "CPOMonthly",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "usedMaintenanceRepairs",
                            fieldId: "usedMaintenanceRepairs",
                            type: "number",
                            list: false,
                            label: "UsedMaintenanceRepairs",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "cpoMaintenanceRepairs",
                            fieldId: "cpoMaintenanceRepairs",
                            type: "number",
                            list: false,
                            label: "CPOMaintenanceRepairs",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "usedTotalMonthly",
                            fieldId: "usedTotalMonthly",
                            type: "number",
                            list: false,
                            label: "UsedTotalMonthly",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "cpoTotalMonthly",
                            fieldId: "cpoTotalMonthly",
                            type: "number",
                            list: false,
                            label: "CPOTotalMonthly",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "cpoYear",
                            fieldId: "cpoYear",
                            type: "number",
                            list: false,
                            label: "Year",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "cpoMake",
                            fieldId: "cpoMake",
                            type: "text",
                            list: false,
                            label: "Make",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "modelName",
                            fieldId: "modelName",
                            type: "text",
                            list: false,
                            label: "ModelName",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "usedCarTrim",
                            fieldId: "usedCarTrim",
                            type: "text",
                            list: false,
                            label: "UsedCarTrim",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoPrice",
                            fieldId: "cpoPrice",
                            type: "text",
                            list: false,
                            label: "CPOPrice",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "usedCarPrice",
                            fieldId: "usedCarPrice",
                            type: "number",
                            list: false,
                            label: "UsedCarPrice",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "vehicleRating",
                            fieldId: "vehicleRating",
                            type: "text",
                            list: false,
                            label: "VehicleRating",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "historicalMotortrendScores",
                fieldId: "historicalMotortrendScores",
                type: "object",
                label: "HistoricalMotortrendScores (Non-Jato)",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["vrPerformance", "toolTipPerformance"],
                        ["overallScore", "toolTipOverallScore"],
                        ["fuelEconomy", "toolTipFuelEconomy"],
                        ["techInnovation", "toolTipTechInnovation"],
                        ["vrValue", "toolTipValue"]
                    ],
                    fields: [
                        createModelField({
                            id: "vrPerformance",
                            fieldId: "vrPerformance",
                            type: "number",
                            list: false,
                            label: "Performance",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipPerformance",
                            fieldId: "toolTipPerformance",
                            type: "text",
                            list: false,
                            label: "ToolTipPerformance",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "overallScore",
                            fieldId: "overallScore",
                            type: "number",
                            list: false,
                            label: "OverallScore",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipOverallScore",
                            fieldId: "toolTipOverallScore",
                            type: "text",
                            list: false,
                            label: "ToolTipOverallScore",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "fuelEconomy",
                            fieldId: "fuelEconomy",
                            type: "number",
                            list: false,
                            label: "fuelEconomy",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipFuelEconomy",
                            fieldId: "toolTipFuelEconomy",
                            type: "text",
                            list: false,
                            label: "toolTipFuelEconomy",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "techInnovation",
                            fieldId: "techInnovation",
                            type: "number",
                            list: false,
                            label: "techInnovation",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipTechInnovation",
                            fieldId: "toolTipTechInnovation",
                            type: "text",
                            list: false,
                            label: "toolTipTechInnovation",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "vrValue",
                            fieldId: "vrValue",
                            type: "number",
                            list: false,
                            label: "Value",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipValue",
                            fieldId: "toolTipValue",
                            type: "text",
                            list: false,
                            label: "toolTipValue",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "recalls",
                fieldId: "recalls",
                list: true,
                label: "Recalls (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [
                        ["recallId", "recallsCampNumber"],
                        ["makeText", "modelText", "yearText", "compName"],
                        ["mfgText", "recallsPotaff", "rcDate"],
                        ["descDefect", "consequenceDefect", "correctiveAction"]
                    ],
                    fields: [
                        createModelField({
                            id: "recallId",
                            fieldId: "recallId",
                            type: "number",
                            list: false,
                            label: "RecallID",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "recallsCampNumber",
                            fieldId: "recallsCampNumber",
                            type: "text",
                            list: false,
                            label: "Campno",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "makeText",
                            fieldId: "makeText",
                            type: "text",
                            list: false,
                            label: "Maketxt",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "modelText",
                            fieldId: "modelText",
                            type: "text",
                            list: false,
                            label: "Modeltxt",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "yearText",
                            fieldId: "yearText",
                            type: "number",
                            list: false,
                            label: "Yeartxt",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "compName",
                            fieldId: "compName",
                            type: "text",
                            list: false,
                            label: "Compname",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "mfgText",
                            fieldId: "mfgText",
                            type: "text",
                            list: false,
                            label: "Mfgtxt",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "recallsPotaff",
                            fieldId: "recallsPotaff",
                            type: "number",
                            list: false,
                            label: "Potaff",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "rcDate",
                            fieldId: "rcDate",
                            type: "text",
                            list: false,
                            label: "Rcdate",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "descDefect",
                            fieldId: "descDefect",
                            type: "text",
                            list: false,
                            label: "DescDefect",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "consequenceDefect",
                            fieldId: "consequenceDefect",
                            type: "text",
                            list: false,
                            label: "ConsequenceDefect",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "correctiveAction",
                            fieldId: "correctiveAction",
                            type: "text",
                            list: false,
                            label: "CorrectiveAction",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "carsRebates",
                fieldId: "carsRebates",
                list: true,
                label: "Rebates (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [
                        ["rebatesLow", "rebatesHigh", "rebateText"],
                        ["nationallyAvailable", "rebatesDescription", "rebatesExpDate"]
                    ],
                    fields: [
                        createModelField({
                            id: "rebatesExpDate",
                            fieldId: "rebatesExpDate",
                            type: "text",
                            list: false,
                            label: "ExpDate",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "rebatesLow",
                            fieldId: "rebatesLow",
                            type: "number",
                            list: false,
                            label: "Low",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "rebatesHigh",
                            fieldId: "rebatesHigh",
                            type: "number",
                            list: false,
                            label: "High",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "rebateText",
                            fieldId: "rebateText",
                            type: "text",
                            list: false,
                            label: "RebateText",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "nationallyAvailable",
                            fieldId: "nationallyAvailable",
                            type: "number",
                            list: false,
                            label: "Nationally Available",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "rebatesDescription",
                            fieldId: "rebatesDescription",
                            type: "text",
                            list: false,
                            label: "Description",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "cpoProgram",
                fieldId: "cpoProgram",
                type: "object",
                label: "CpoProgram (Non-Jato)",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["cpoName", "cpoInspectionPoint", "cpoInspectionScore"],
                        ["cpoAgeMileage", "cpoWarranty", "cpoWarrantyDeductible"],
                        ["cpoWarrantyBbnc", "cpoWarrantyTransferable", "cpoWarrantyExtended"],
                        ["cpoRoadside", "cpoReturnExchange", "cpoFinancing"],
                        ["cpoLease", "cpoWebsite", "cpoCustomerServiceNumber"],
                        ["cpoParticipation", "cpoHistoryReport", "cpoAdditionalBenefits"],
                        ["cpoProgramOverview"]
                    ],
                    fields: [
                        createModelField({
                            id: "cpoName",
                            fieldId: "cpoName",
                            type: "text",
                            list: false,
                            label: "CpoName",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoInspectionPoint",
                            fieldId: "cpoInspectionPoint",
                            type: "text",
                            list: false,
                            label: "CPOInspectionPoint",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoInspectionScore",
                            fieldId: "cpoInspectionScore",
                            type: "number",
                            list: false,
                            label: "CPOInspectionScore",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "cpoAgeMileage",
                            fieldId: "cpoAgeMileage",
                            type: "text",
                            list: false,
                            label: "CPOAgeMileage",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoWarranty",
                            fieldId: "cpoWarranty",
                            type: "text",
                            list: false,
                            label: "CPOWarranty",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoWarrantyDeductible",
                            fieldId: "cpoWarrantyDeductible",
                            type: "text",
                            list: false,
                            label: "CPOWarrantyDeductible",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoWarrantyBbnc",
                            fieldId: "cpoWarrantyBbnc",
                            type: "text",
                            list: false,
                            label: "CPOWarrantyBbnc",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoWarrantyTransferable",
                            fieldId: "cpoWarrantyTransferable",
                            type: "text",
                            list: false,
                            label: "CPOWarrantyTransferable",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoWarrantyExtended",
                            fieldId: "cpoWarrantyExtended",
                            type: "text",
                            list: false,
                            label: "CPOWarrantyExtended",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoRoadside",
                            fieldId: "cpoRoadside",
                            type: "text",
                            list: false,
                            label: "CPORoadside",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoReturnExchange",
                            fieldId: "cpoReturnExchange",
                            type: "text",
                            list: false,
                            label: "CPOReturnExchange",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoFinancing",
                            fieldId: "cpoFinancing",
                            type: "text",
                            list: false,
                            label: "CPOFinancing",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoLease",
                            fieldId: "cpoLease",
                            type: "text",
                            list: false,
                            label: "CPOLease",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoWebsite",
                            fieldId: "cpoWebsite",
                            type: "text",
                            list: false,
                            label: "CPOWebsite",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoCustomerServiceNumber",
                            fieldId: "cpoCustomerServiceNumber",
                            type: "text",
                            list: false,
                            label: "CPOCustomerServiceNumber",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoParticipation",
                            fieldId: "cpoParticipation",
                            type: "text",
                            list: false,
                            label: "CPOParticipation",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoHistoryReport",
                            fieldId: "cpoHistoryReport",
                            type: "number",
                            list: false,
                            label: "CPOHistoryReport",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "cpoAdditionalBenefits",
                            fieldId: "cpoAdditionalBenefits",
                            type: "text",
                            list: false,
                            label: "CPOAdditionalBenefits",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "cpoProgramOverview",
                            fieldId: "cpoProgramOverview",
                            type: "text",
                            list: false,
                            label: "CPOProgramOverview",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "realmpg",
                fieldId: "realmpg",
                type: "object",
                label: "RealMpg (Non-Jato)",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["realmpgAverageMpg", "realmpgAverageMpgCity", "realmpgAverageMpgHwy"]
                    ],
                    fields: [
                        createModelField({
                            id: "realmpgAverageMpg",
                            fieldId: "realmpgAverageMpg",
                            type: "number",
                            list: false,
                            label: "RealmpgAverageMpg",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "realmpgAverageMpgCity",
                            fieldId: "realmpgAverageMpgCity",
                            type: "number",
                            list: false,
                            label: "RealmpgAverageMpgCity",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "realmpgAverageMpgHwy",
                            fieldId: "realmpgAverageMpgHwy",
                            type: "number",
                            list: false,
                            label: "RealmpgAverageMpgHwy",
                            renderer: {
                                name: "number-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "hubs",
                fieldId: "hubs",
                list: true,
                label: "Hubs (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [["hubsImage", "makeModelHub", "hubsName", "hubsText"]],
                    fields: [
                        createModelField({
                            id: "hubsImage",
                            fieldId: "hubsImage",
                            type: "text",
                            list: false,
                            label: "Image",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "makeModelHub",
                            fieldId: "makeModelHub",
                            type: "number",
                            list: false,
                            label: "MakeModelHub",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "hubsName",
                            fieldId: "hubsName",
                            type: "text",
                            list: false,
                            label: "Name",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "hubsText",
                            fieldId: "hubsText",
                            type: "text",
                            list: false,
                            label: "Text",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "seoText",
                fieldId: "seoText",
                type: "object",
                label: "Seo",
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [["seoType", "seoTitle"], ["seoContent"]],
                    fields: [
                        createModelField({
                            id: "seoType",
                            fieldId: "seoType",
                            list: false,
                            type: "text",
                            label: "Type",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "seoTitle",
                            fieldId: "seoTitle",
                            list: false,
                            type: "text",
                            label: "Title",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "seoContent",
                            fieldId: "seoContent",
                            list: false,
                            type: "text",
                            label: "Content",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "images",
                fieldId: "images",
                list: true,
                label: "Images (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [["imageUrl"], ["imageAngle", "imageType", "imageOrder"]],
                    fields: [
                        createModelField({
                            id: "imageUrl",
                            fieldId: "imageUrl",
                            type: "text",
                            label: "Image Url",
                            renderer: {
                                name: "text-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "imageAngle",
                            fieldId: "imageAngle",
                            type: "text",
                            help: "can be front or rear...etc",
                            label: "Image Angle",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "imageType",
                            fieldId: "imageType",
                            type: "text",
                            help: "can be exterior or interior",
                            label: "Image Type",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "imageOrder",
                            fieldId: "imageOrder",
                            type: "number",
                            help: "can be use for display order",
                            label: "Image Order",
                            renderer: {
                                name: "number-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "featuresIntellicar",
                fieldId: "featuresIntellicar",
                type: "object",
                label: "Features(Non-Jato)",
                list: false,
                renderer: {
                    name: "object-accordion"
                },
                settings: {
                    layout: [
                        ["packageCategory"],
                        ["engineCategory"],
                        ["transmissionCategory"],
                        ["exteriorColorCategory"],
                        ["interiorColorCategory"],
                        ["topColorCategory"],
                        ["bodyCategory"],
                        ["brakesCategory"],
                        ["convenienceCategory"],
                        ["driveCategory"],
                        ["engineeringCategory"],
                        ["exteriorCategory"],
                        ["interiorCategory"],
                        ["lightingCategory"],
                        ["mandatoryCategory"],
                        ["mirrorsCategory"],
                        ["noteCategory"],
                        ["otherCategory"],
                        ["paintCategory"],
                        ["safetyCategory"],
                        ["seatsCategory"],
                        ["soundCategory"],
                        ["specialFeesCreditsOptionsCategory"],
                        ["steeringCategory"],
                        ["suspensionCategory"],
                        ["tiresCategory"],
                        ["towingCategory"],
                        ["truckBedsCategory"],
                        ["wheelsCategory"]
                    ],
                    fields: [
                        createModelField({
                            id: "packageCategory",
                            fieldId: "packageCategory",
                            type: "object",
                            label: "PACKAGE",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "engineCategory",
                            fieldId: "engineCategory",
                            type: "object",
                            label: "ENGINE",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "SequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "transmissionCategory",
                            fieldId: "transmissionCategory",
                            type: "object",
                            label: "TRANSMISSION",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "exteriorColorCategory",
                            fieldId: "exteriorColorCategory",
                            type: "object",
                            label: "EXTERIOR COLOR",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "interiorColorCategory",
                            fieldId: "interiorColorCategory",
                            type: "object",
                            label: "INTERIOR COLOR",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "topColorCategory",
                            fieldId: "topColorCategory",
                            type: "object",
                            label: "TOP COLOR",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "bodyCategory",
                            fieldId: "bodyCategory",
                            type: "object",
                            label: "BODY",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "brakesCategory",
                            fieldId: "brakesCategory",
                            type: "object",
                            label: "BRAKES",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "convenienceCategory",
                            fieldId: "convenienceCategory",
                            type: "object",
                            label: "CONVENIENCE",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "driveCategory",
                            fieldId: "driveCategory",
                            type: "object",
                            label: "DRIVE",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "engineeringCategory",
                            fieldId: "engineeringCategory",
                            type: "object",
                            label: "ENGINEERING",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "exteriorCategory",
                            fieldId: "exteriorCategory",
                            type: "object",
                            label: "EXTERIOR",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "interiorCategory",
                            fieldId: "interiorCategory",
                            type: "object",
                            label: "INTERIOR",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "lightingCategory",
                            fieldId: "lightingCategory",
                            type: "object",
                            label: "LIGHTING",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "mandatoryCategory",
                            fieldId: "mandatoryCategory",
                            type: "object",
                            label: "MANDATORY",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "mirrorsCategory",
                            fieldId: "mirrorsCategory",
                            type: "object",
                            label: "MIRRORS",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "noteCategory",
                            fieldId: "noteCategory",
                            type: "object",
                            label: "NOTE",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "otherCategory",
                            fieldId: "otherCategory",
                            type: "object",
                            label: "OTHER",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "paintCategory",
                            fieldId: "paintCategory",
                            type: "object",
                            label: "PAINT",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "safetyCategory",
                            fieldId: "safetyCategory",
                            type: "object",
                            label: "SAFETY",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "seatsCategory",
                            fieldId: "seatsCategory",
                            type: "object",
                            label: "SEATS",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "soundCategory",
                            fieldId: "soundCategory",
                            type: "object",
                            label: "SOUND",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "specialFeesCreditsOptionsCategory",
                            fieldId: "specialFeesCreditsOptionsCategory",
                            type: "object",
                            label: "SPECIAL FEES CREDITS OPTIONS",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "steeringCategory",
                            fieldId: "steeringCategory",
                            type: "object",
                            label: "STEERING",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "suspensionCategory",
                            fieldId: "suspensionCategory",
                            type: "object",
                            label: "SUSPENSION",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "tiresCategory",
                            fieldId: "tiresCategory",
                            type: "object",
                            label: "TIRES",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "towingCategory",
                            fieldId: "towingCategory",
                            type: "object",
                            label: "TOWING",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "truckBedsCategory",
                            fieldId: "truckBedsCategory",
                            type: "object",
                            label: "TRUCK BEDS",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        }),
                        createModelField({
                            id: "wheelsCategory",
                            fieldId: "wheelsCategory",
                            type: "object",
                            label: "WHEELS",
                            list: true,
                            renderer: {
                                name: "objects-accordion"
                            },
                            settings: {
                                layout: [
                                    ["name", "availability", "invoice"],
                                    ["includesNote", "retail"],
                                    ["sequenceNmb", "categorySequenceNmb"]
                                ],
                                fields: [
                                    createModelField({
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        list: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }),
                                    createModelField({
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        list: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    })
                                ]
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "vehicleRankingClass",
                fieldId: "vehicleRankingClass",
                type: "object",
                list: true,
                label: "Motortrend Scores (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                settings: {
                    layout: [
                        ["classTitle", "classSlugRedirect", "classPosition"],
                        ["rankClass", "slugClassTitle", "associatedBody"],
                        ["vrcSubclass", "subclassTitle", "vrcSubclassPosition"],
                        ["vrPerformance", "toolTipPerformance"],
                        ["overallScore", "toolTipOverallScore"],
                        ["fuelEconomy", "toolTipFuelEconomy"],
                        ["techInnovation", "toolTipTechInnovation"],
                        ["vrValue", "toolTipValue"],
                        ["vrcClassThumbnailUrl", "vrcClassThumbnailRolloverUrl"],
                        ["vrcIsMakeBodyStyleVehicleShow", "vrcIsRankShow", "vrcIsVehicleShow"],
                        ["vrcRankWithinSubclass", "vrcRankInSubclassText"],
                        ["vrcTopRankingTrophyImage"]
                    ],
                    fields: [
                        createModelField({
                            id: "classTitle",
                            fieldId: "classTitle",
                            type: "text",
                            label: "ClassTitle",
                            renderer: {
                                name: "text-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "classSlugRedirect",
                            fieldId: "classSlugRedirect",
                            type: "text",
                            label: "ClassSlugRedirect",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "associatedBody",
                            fieldId: "associatedBody",
                            type: "number",
                            label: "AssociatedBody",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "classPosition",
                            fieldId: "classPosition",
                            type: "number",
                            label: "ClassPosition",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "rankClass",
                            fieldId: "rankClass",
                            type: "text",
                            label: "RankClass",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "slugClassTitle",
                            fieldId: "slugClassTitle",
                            type: "text",
                            label: "SlugClassTitle",
                            renderer: {
                                name: "text-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "subclassTitle",
                            fieldId: "subclassTitle",
                            type: "text",
                            label: "SubclassTitle",
                            renderer: {
                                name: "text-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "vrPerformance",
                            fieldId: "vrPerformance",
                            type: "number",
                            label: "Performance",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipPerformance",
                            fieldId: "toolTipPerformance",
                            type: "text",
                            label: "ToolTipPerformance",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "overallScore",
                            fieldId: "overallScore",
                            type: "number",
                            label: "OverallScore",
                            renderer: {
                                name: "number-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "toolTipOverallScore",
                            fieldId: "toolTipOverallScore",
                            type: "text",
                            label: "ToolTipOverallScore",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "fuelEconomy",
                            fieldId: "fuelEconomy",
                            type: "number",
                            label: "fuelEconomy",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipFuelEconomy",
                            fieldId: "toolTipFuelEconomy",
                            type: "text",
                            label: "toolTipFuelEconomy",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "techInnovation",
                            fieldId: "techInnovation",
                            type: "number",
                            label: "techInnovation",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipTechInnovation",
                            fieldId: "toolTipTechInnovation",
                            type: "text",
                            label: "toolTipTechInnovation",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "vrValue",
                            fieldId: "vrValue",
                            type: "number",
                            label: "Value",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "toolTipValue",
                            fieldId: "toolTipValue",
                            type: "text",
                            label: "toolTipValue",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "vrcClassThumbnailRolloverUrl",
                            fieldId: "classThumbnailRolloverUrl",
                            type: "text",
                            label: "Class ThumbnailRolloverUrl",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "vrcClassThumbnailUrl",
                            fieldId: "classThumbnailUrl",
                            type: "text",
                            label: "Class ThumbnailUrl",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "vrcIsMakeBodyStyleVehicleShow",
                            fieldId: "isMakeBodyStyleVehicleShow",
                            type: "number",
                            label: "Is MakeBodyStyle VehicleShow",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "vrcIsRankShow",
                            fieldId: "isRankShow",
                            type: "number",
                            label: "Is RankShow",
                            renderer: {
                                name: "number-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "vrcIsVehicleShow",
                            fieldId: "isVehicleShow",
                            type: "number",
                            label: "Is VehicleShow",
                            renderer: {
                                name: "number-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "vrcRankInSubclassText",
                            fieldId: "rankInSubclassText",
                            type: "text",
                            label: "RankIn SubclassText",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "vrcRankWithinSubclass",
                            fieldId: "rankWithinSubclass",
                            type: "number",
                            label: "RankWithin Subclass",
                            renderer: {
                                name: "number-input"
                            },
                            help: "This is a Required Field."
                        }),
                        createModelField({
                            id: "vrcSubclass",
                            fieldId: "subclass",
                            type: "text",
                            label: "subclass",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "vrcSubclassPosition",
                            fieldId: "subclassPosition",
                            type: "number",
                            label: "Subclass Position",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "vrcTopRankingTrophyImage",
                            fieldId: "topRankingTrophyImage",
                            type: "text",
                            label: "TopRanking Trophy Image",
                            renderer: {
                                name: "text-input"
                            }
                        })
                    ]
                }
            }),
            createModelField({
                id: "carMatchCustomRankings",
                fieldId: "carMatchCustomRankings",
                list: true,
                label: "carMatchCustomRankings (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [
                        ["carMatchBody", "carMatchSeats", "carMatchLuxury"],
                        ["carMatchGreen", "carMatchOffroad", "carMatchBudget"],
                        ["carMatchPriority", "carMatchEstimated", "totalPercentage"],
                        ["seatingCapacity", "carMatchHorsepower", "winnerDescription"],
                        ["priceRange", "carMatchMpg", "carMatchUUID"],
                        ["rankWithinSubclass", "carMatchSubClassTitle"]
                    ],
                    fields: [
                        createModelField({
                            id: "carMatchBody",
                            fieldId: "carMatchBody",
                            type: "text",
                            list: false,
                            label: "Body",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchSeats",
                            fieldId: "carMatchSeats",
                            type: "text",
                            list: false,
                            label: "Seats",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchLuxury",
                            fieldId: "carMatchLuxury",
                            type: "text",
                            list: false,
                            label: "Luxury",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchGreen",
                            fieldId: "carMatchGreen",
                            type: "text",
                            list: false,
                            label: "Green",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchOffroad",
                            fieldId: "carMatchOffroad",
                            type: "text",
                            list: false,
                            label: "Offroad",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchBudget",
                            fieldId: "carMatchBudget",
                            type: "text",
                            list: false,
                            label: "Budget",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "totalPercentage",
                            fieldId: "totalPercentage",
                            type: "number",
                            list: false,
                            label: "TotalPercentage",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchPriority",
                            fieldId: "carMatchPriority",
                            type: "number",
                            list: false,
                            label: "Priority",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchEstimated",
                            fieldId: "carMatchEstimated",
                            type: "number",
                            list: false,
                            label: "Estimated",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "priceRange",
                            fieldId: "priceRange",
                            type: "text",
                            list: false,
                            label: "PriceRange",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchMpg",
                            fieldId: "carMatchMpg",
                            type: "text",
                            list: false,
                            label: "Mpg",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "seatingCapacity",
                            fieldId: "seatingCapacity",
                            type: "text",
                            list: false,
                            label: "SeatingCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchHorsepower",
                            fieldId: "carMatchHorsepower",
                            type: "text",
                            list: false,
                            label: "horsepower",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "winnerDescription",
                            fieldId: "winnerDescription",
                            type: "text",
                            list: false,
                            label: "WinnerDescription",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "rankWithinSubclass",
                            fieldId: "rankWithinSubclass",
                            type: "number",
                            list: false,
                            label: "RankWithinSubclass",
                            renderer: {
                                name: "number-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchSubClassTitle",
                            fieldId: "carMatchSubClassTitle",
                            type: "text",
                            list: false,
                            label: "SubClassTitle",
                            renderer: {
                                name: "text-input"
                            }
                        }),
                        createModelField({
                            id: "carMatchUUID",
                            fieldId: "carMatchUUID",
                            type: "number",
                            label: "UUID (PermaLinkID)",
                            renderer: {
                                name: "number-input"
                            }
                        })
                    ]
                }
            })
        ],
        layout: [
            ["carsVehicle"],
            ["bodyStyle", "carsMakePageShow", "carsPricePageShow"],
            ["vehicleNmb", "carsUid", "trimName", "carsDiscontinued"],
            ["carsMake", "carsModelName", "carsYear"],
            ["slugMake", "slugModelName", "slugTrimName"],
            ["baseVehicle", "releaseType", "newUsedBg"],
            ["manufacturerCd", "slugBodystyle", "makeFeaturedImage"],
            ["makeIcon", "makeDiscontinued", "oemUrl"],
            ["carsSubcategory", "slugSubcategory", "mainCategory"],
            ["slugMainCategory", "hybridElectricCategory", "slugHybridElectricCategory"],
            ["dieselCategory", "slugDieselCategory", "updatedOn"],
            ["vehicleStatus", "featuredImage", "priceRangeText"],
            ["propertyType", "marketingImage", "priceRangeValue"],
            ["ymmPriceRange", "priceRangeSlug", "latestYear"],
            ["ymmLowestPriceRange", "ymmMaxPriceRange", "makeThumbnailUrl"],
            ["combinedPrice", "carsCombinedEpaMpg", "horsePowerVal"],
            ["slugMakeModel", "slugYearMakeModel", "retainedValue", "standardTires"],
            ["bodyTypeOrder", "bodyType", "bodyTypeText", "slugBodyType"],
            [
                "secondaryBodyTypeOrder",
                "secondaryBodyType",
                "secondaryBodyTypeText",
                "slugSecondaryBodyType"
            ],
            ["carsEditorialRating"],
            ["specifications"],
            ["powertrains"],
            ["warranty"],
            ["pricing"],
            ["safetyRatings"],
            ["ownershipCosts"],
            ["cpoComparison"],
            ["carsRebates"],
            ["historicalMotortrendScores"],
            ["recalls"],
            ["cpoProgram"],
            ["realmpg"],
            ["hubs"],
            ["featuresIntellicar"],
            ["seoText"],
            ["images"],
            ["vehicleRankingClass"],
            ["carMatchCustomRankings"]
        ],
        titleFieldId: "carsVehicle"
    };
};
