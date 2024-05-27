import { CmsModelCreateInput } from "@webiny/api-headless-cms/types";
import { CmsGroup } from "@webiny/api-headless-cms/types";

export const createCarsModel = (group: CmsGroup): CmsModelCreateInput => {
    return {
        name: "Cars",
        modelId: "cars",
        singularApiName: "Cars",
        pluralApiName: "Cars",
        description: "Cars Data Model",
        group: group.id,
        fields: [
            {
                id: "carsVehicle",
                fieldId: "carsVehicle",
                type: "text",
                label: "Vehicle",
                helpText: "Make Model Year and Trim",
                renderer: {
                    name: "text-input"
                },
                validation: [
                    {
                        name: "required",
                        message: "Value is required."
                    }
                ]
            },
            {
                id: "vehicleNmb",
                fieldId: "vehicleNmb",
                type: "number",
                label: "VehicleNumber",
                helpText: "A unique vehicle number",
                renderer: {
                    name: "number-input"
                },
                validation: [
                    {
                        name: "required",
                        message: "Value is required."
                    }
                ]
            },
            {
                id: "carsYear",
                fieldId: "carsYear",
                type: "number",
                label: "Year",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "carsMake",
                fieldId: "carsMake",
                type: "text",
                label: "Make",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "carsModelName",
                fieldId: "carsModelName",
                type: "text",
                label: "ModelName",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "trimName",
                fieldId: "trimName",
                type: "text",
                label: "TrimName",
                multipleValues: false,
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "bodyStyle",
                fieldId: "bodyStyle",
                multipleValues: false,
                type: "text",
                label: "BodyStyle",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "manufacturerCd",
                fieldId: "manufacturerCd",
                type: "text",
                label: "Manufacturer Code",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "releaseType",
                fieldId: "releaseType",
                type: "text",
                label: "ReleaseType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "newUsedBg",
                fieldId: "newUsedBg",
                type: "text",
                label: "NewUsedBg (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "carsUid",
                fieldId: "carsUid",
                type: "number",
                label: "UID",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "carsDiscontinued",
                fieldId: "carsDiscontinued",
                type: "number",
                label: "Discontinued",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "slugMake",
                fieldId: "slugMake",
                type: "text",
                label: "Slug Make",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugModelName",
                fieldId: "slugModelName",
                type: "text",
                label: "SlugModelName",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugTrimName",
                fieldId: "slugTrimName",
                type: "text",
                label: "SlugTrimName (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugBodystyle",
                fieldId: "slugBodystyle",
                type: "text",
                label: "SlugBodystyle (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "makeFeaturedImage",
                fieldId: "makeFeaturedImage",
                type: "text",
                label: "MakeFeaturedImage (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "makeIcon",
                fieldId: "makeIcon",
                type: "text",
                label: "MakeIcon (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "makeDiscontinued",
                fieldId: "makeDiscontinued",
                type: "number",
                label: "Make Discontinued",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "baseVehicle",
                fieldId: "baseVehicle",
                type: "number",
                label: "BaseVehicle (non-jato)",
                renderer: {
                    name: "number-input"
                },
                helpText: "This is a Required Field."
            },
            {
                id: "oemUrl",
                fieldId: "oemUrl",
                type: "text",
                label: "OemUrl (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "carsSubcategory",
                fieldId: "carsSubcategory",
                type: "text",
                label: "Subcategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugSubcategory",
                fieldId: "slugSubcategory",
                type: "text",
                label: "SlugSubcategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "mainCategory",
                fieldId: "mainCategory",
                type: "text",
                label: "MainCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugMainCategory",
                fieldId: "slugMainCategory",
                type: "text",
                label: "SlugMainCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "hybridElectricCategory",
                fieldId: "hybridElectricCategory",
                type: "text",
                label: "HybridElectricCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugHybridElectricCategory",
                fieldId: "slugHybridElectricCategory",
                type: "text",
                label: "SlugHybridElectricCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "dieselCategory",
                fieldId: "dieselCategory",
                type: "text",
                label: "DieselCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugDieselCategory",
                fieldId: "slugDieselCategory",
                type: "text",
                label: "SlugDieselCategory (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "updatedOn",
                fieldId: "updatedOn",
                type: "text",
                label: "UpdatedOn",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "vehicleStatus",
                fieldId: "vehicleStatus",
                type: "number",
                label: "VehicleStatus (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "featuredImage",
                fieldId: "featuredImage",
                type: "text",
                label: "FeaturedImage (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "propertyType",
                fieldId: "propertyType",
                type: "text",
                label: "PropertyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "marketingImage",
                fieldId: "marketingImage",
                type: "text",
                label: "MarketingImage (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "priceRangeValue",
                fieldId: "priceRangeValue",
                type: "number",
                label: "PriceRangeValue (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "priceRangeText",
                fieldId: "priceRangeText",
                type: "text",
                label: "PriceRangeText (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "ymmPriceRange",
                fieldId: "ymmPriceRange",
                type: "text",
                label: "YMMPriceRange (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "bodyType",
                fieldId: "bodyType",
                type: "text",
                label: "BodyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "bodyTypeText",
                fieldId: "bodyTypeText",
                type: "text",
                label: "BodyType Text (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugBodyType",
                fieldId: "slugBodyType",
                type: "text",
                label: "SlugBodyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "bodyTypeOrder",
                fieldId: "bodyTypeOrder",
                type: "number",
                label: "BodyTypeOrder (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "secondaryBodyType",
                fieldId: "secondaryBodyType",
                type: "text",
                label: "SecondaryBodyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "secondaryBodyTypeText",
                fieldId: "secondaryBodyTypeText",
                type: "text",
                label: "SecondaryBodyTypeText (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugSecondaryBodyType",
                fieldId: "slugSecondaryBodyType",
                type: "text",
                label: "SlugSecondaryBodyType (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "secondaryBodyTypeOrder",
                fieldId: "secondaryBodyTypeOrder",
                type: "number",
                label: "SecondaryBodyTypeOrder (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "priceRangeSlug",
                fieldId: "priceRangeSlug",
                type: "text",
                label: "PriceRangeSlug (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "latestYear",
                fieldId: "latestYear",
                type: "number",
                label: "LatestYear (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "ymmLowestPriceRange",
                fieldId: "ymmLowestPriceRange",
                type: "number",
                label: "YMMLowestPriceRange (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "ymmMaxPriceRange",
                fieldId: "ymmMaxPriceRange",
                type: "number",
                label: "YMMMaxPriceRange (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "makeThumbnailUrl",
                fieldId: "makeThumbnailUrl",
                type: "text",
                label: "MakeThumbnailUrl (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "combinedPrice",
                fieldId: "combinedPrice",
                type: "number",
                label: "CombinedPrice (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "carsCombinedEpaMpg",
                fieldId: "carsCombinedEpaMpg",
                type: "number",
                label: "CombinedEpaMPG (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "horsePowerVal",
                fieldId: "horsePowerVal",
                type: "number",
                label: "HorsePowerVal (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
                id: "slugMakeModel",
                fieldId: "slugMakeModel",
                type: "text",
                label: "SlugMakeModel (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "slugYearMakeModel",
                fieldId: "slugYearMakeModel",
                type: "text",
                label: "SlugYearMakeModel (non-jato)",
                renderer: {
                    name: "text-input"
                },
                helpText: "This is a Required Field."
            },
            {
                id: "retainedValue",
                fieldId: "retainedValue",
                type: "text",
                label: "RetainedValue (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "standardTires",
                fieldId: "standardTires",
                type: "text",
                label: "StandardTires (non-jato)",
                renderer: {
                    name: "text-input"
                }
            },
            {
                id: "carsMakePageShow",
                fieldId: "carsMakePageShow",
                type: "number",
                label: "Make Page Show (non-jato)",
                renderer: {
                    name: "number-input"
                },
                helpText: "This is a Required Field."
            },
            {
                id: "carsPricePageShow",
                fieldId: "carsPricePageShow",
                type: "number",
                label: "PriceRange Page Show (non-jato)",
                renderer: {
                    name: "number-input"
                },
                helpText: "This is a Required Field."
            },
            {
                id: "carsEditorialRating",
                fieldId: "editorialRating",
                type: "number",
                label: "Editorial Rating (non-jato)",
                renderer: {
                    name: "number-input"
                }
            },
            {
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
                        {
                            id: "driveTrain",
                            fieldId: "driveTrain",
                            multipleValues: false,
                            type: "text",
                            label: "Drivetrain",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "seatingCapacity",
                            fieldId: "seatingCapacity",
                            multipleValues: false,
                            type: "text",
                            label: "SeatingCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "specWidth",
                            fieldId: "specWidth",
                            multipleValues: false,
                            type: "text",
                            label: "Width",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "specLength",
                            fieldId: "specLength",
                            multipleValues: false,
                            type: "text",
                            label: "Length",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "specHeight",
                            fieldId: "specHeight",
                            multipleValues: false,
                            type: "text",
                            label: "Height",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "specWheelase",
                            fieldId: "specWheelbase",
                            type: "text",
                            multipleValues: false,
                            label: "Wheelbase",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "frontHeadroom",
                            fieldId: "frontHeadroom",
                            type: "text",
                            multipleValues: false,
                            label: "FrontHeadroom",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "rearHeadroom",
                            fieldId: "rearHeadroom",
                            type: "text",
                            multipleValues: false,
                            label: "RearHeadroom",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "frontShoulderRoom",
                            fieldId: "frontShoulderRoom",
                            type: "text",
                            multipleValues: false,
                            label: "FrontShoulderRoom",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "rearShoulderRoom",
                            fieldId: "rearShoulderRoom",
                            type: "text",
                            multipleValues: false,
                            label: "RearShoulderRoom",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "frontLegroom",
                            fieldId: "frontLegroom",
                            type: "text",
                            multipleValues: false,
                            label: "FrontLegroom",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "rearLegroom",
                            fieldId: "rearLegroom",
                            type: "text",
                            multipleValues: false,
                            label: "RearLegroom",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "groundClearance",
                            fieldId: "groundClearance",
                            type: "text",
                            multipleValues: false,
                            label: "GroundClearance",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "curbWeight",
                            fieldId: "curbWeight",
                            type: "text",
                            multipleValues: false,
                            label: "CurbWeight",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cargoCapacity",
                            fieldId: "cargoCapacity",
                            type: "text",
                            multipleValues: false,
                            label: "CargoCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "specGvwr",
                            fieldId: "specGvwr",
                            type: "text",
                            multipleValues: false,
                            label: "GVWR",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "payloadCapacity",
                            fieldId: "payloadCapacity",
                            type: "text",
                            multipleValues: false,
                            label: "PayloadCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "towingCapacity",
                            fieldId: "towingCapacity",
                            type: "text",
                            multipleValues: false,
                            label: "TowingCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "engineName",
                            fieldId: "engineName",
                            type: "text",
                            multipleValues: false,
                            label: "EngineName",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "specHorsepower",
                            fieldId: "specHorsepower",
                            type: "text",
                            multipleValues: false,
                            label: "Horsepower",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "specTorque",
                            fieldId: "specTorque",
                            type: "text",
                            multipleValues: false,
                            label: "Torque",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "fuelType",
                            fieldId: "fuelType",
                            multipleValues: false,
                            type: "text",
                            label: "FuelType",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "fuelCapacity",
                            fieldId: "fuelCapacity",
                            multipleValues: false,
                            type: "text",
                            label: "FuelCapacity (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "stdEpaMpg",
                            fieldId: "stdEpaMpg",
                            type: "text",
                            multipleValues: false,
                            label: "StdEpaMpg",
                            renderer: {
                                name: "text-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "transmissionName",
                            fieldId: "transmissionName",
                            type: "text",
                            multipleValues: false,
                            label: "TransmissionName",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "transmissionType",
                            fieldId: "transmissionType",
                            type: "text",
                            multipleValues: false,
                            label: "TransmissionType",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "drivingRange",
                            fieldId: "drivingRange",
                            type: "text",
                            multipleValues: false,
                            label: "DrivingRange",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cylinderConfiguration",
                            fieldId: "cylinderConfiguration",
                            type: "text",
                            multipleValues: false,
                            label: "CylinderConfiguration",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "numberOfCylinders",
                            fieldId: "numberOfCylinders",
                            type: "text",
                            multipleValues: false,
                            label: "NumberOfCylinders",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "specTonnage",
                            fieldId: "specTonnage",
                            type: "text",
                            multipleValues: false,
                            label: "Tonnage (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "stdMpgWithUnits",
                            fieldId: "stdMpgWithUnits",
                            type: "text",
                            multipleValues: false,
                            label: "StdMpg With Units (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "heroLabel1",
                            fieldId: "heroLabel1",
                            type: "text",
                            multipleValues: false,
                            label: "Hero Label1 (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "heroValue1",
                            fieldId: "heroValue1",
                            type: "text",
                            multipleValues: false,
                            label: "Hero Value1 (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "vehicleClass",
                            fieldId: "vehicleClass",
                            type: "text",
                            multipleValues: false,
                            label: "VehicleClass (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "engineType",
                            fieldId: "engineType",
                            type: "text",
                            multipleValues: false,
                            label: "Engine Type (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
                id: "powertrains",
                fieldId: "powertrains",
                multipleValues: true,
                label: "Powertrains (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [["ptHorseower", "ptCityMpg", "ptHwyMpg"]],
                    fields: [
                        {
                            id: "ptHorseower",
                            fieldId: "ptHorseower",
                            type: "number",
                            multipleValues: false,
                            label: "Horsepower",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "ptCityMpg",
                            fieldId: "ptCityMpg",
                            type: "number",
                            multipleValues: false,
                            label: "CityMpg",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "ptHwyMpg",
                            fieldId: "ptHwyMpg",
                            type: "number",
                            multipleValues: false,
                            label: "HwyMpg",
                            renderer: {
                                name: "number-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "fullWarrantyMiles",
                            fieldId: "fullWarrantyMiles",
                            type: "text",
                            multipleValues: false,
                            label: "FullWarrantyMiles",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "fullWarrantyMonths",
                            fieldId: "fullWarrantyMonths",
                            type: "text",
                            multipleValues: false,
                            label: "FullWarrantyMonths",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "powertrainWarrantyMiles",
                            fieldId: "powertrainWarrantyMiles",
                            type: "text",
                            multipleValues: false,
                            label: "PowertrainWarrantyMiles",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "powertrainWarrantyMonths",
                            fieldId: "powertrainWarrantyMonths",
                            type: "text",
                            multipleValues: false,
                            label: "PowertrainWarrantyMonths",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "maintenanceWarrantyMiles",
                            fieldId: "maintenanceWarrantyMiles",
                            type: "text",
                            multipleValues: false,
                            label: "MaintenanceWarrantyMiles (non-jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "maintenanceWarrantyMonths",
                            fieldId: "maintenanceWarrantyMonths",
                            type: "text",
                            multipleValues: false,
                            label: "MaintenanceWarrantyMonths (non-jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "roadsideWarrantyMiles",
                            fieldId: "roadsideWarrantyMiles",
                            type: "text",
                            multipleValues: false,
                            label: "RoadsideWarrantyMiles",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "roadsideWarrantyMonths",
                            fieldId: "roadsideWarrantyMonths",
                            type: "text",
                            multipleValues: false,
                            label: "RoadsideWarrantyMonths",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "corrosionWarrantyMiles",
                            fieldId: "corrosionWarrantyMiles",
                            type: "text",
                            multipleValues: false,
                            label: "CorrosionWarrantyMiles",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "corrosionWarrantyMonths",
                            fieldId: "corrosionWarrantyMonths",
                            type: "text",
                            multipleValues: false,
                            label: "CorrosionWarrantyMonths",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "pInvoice",
                            fieldId: "pInvoice",
                            type: "number",
                            multipleValues: false,
                            label: "Invoice",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pMsrp",
                            fieldId: "pMsrp",
                            type: "number",
                            multipleValues: false,
                            label: "MSRP",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pDestination",
                            fieldId: "pDestination",
                            type: "number",
                            multipleValues: false,
                            label: "Destination",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pEffectiveOn",
                            fieldId: "pEffectiveOn",
                            type: "text",
                            multipleValues: false,
                            label: "PriceEffectiveOn",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "pTargetPrice",
                            fieldId: "pTargetPrice",
                            type: "number",
                            multipleValues: false,
                            label: "Target Price(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pTotalTargetPrice",
                            fieldId: "pTotalTargetPrice",
                            type: "number",
                            multipleValues: false,
                            label: "Total TargetPrice(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pAverageSalesTaxAndFees",
                            fieldId: "pAverageSalesTaxAndFees",
                            type: "number",
                            multipleValues: false,
                            label: "AverageSalesTaxAndFees(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pGasGuzzlerTax",
                            fieldId: "pGasGuzzlerTax",
                            type: "number",
                            multipleValues: false,
                            label: "GasGuzzlerTax(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pTargetRebate",
                            fieldId: "pTargetRebate",
                            type: "number",
                            multipleValues: false,
                            label: "Target Rebate(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pNewMonthly",
                            fieldId: "pNewMonthly",
                            type: "number",
                            multipleValues: false,
                            label: "NewMonthly(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pCpoPrice",
                            fieldId: "pCpoPrice",
                            type: "text",
                            multipleValues: false,
                            label: "CpoPrice(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "pExcellentRetailValue",
                            fieldId: "pExcellentRetailValue",
                            type: "number",
                            multipleValues: false,
                            label: "ExcellentRetailValue(Non-Jato)",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "pMsrpLabel",
                            fieldId: "pMsrpLabel",
                            type: "text",
                            multipleValues: false,
                            label: "MsrpLabel(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "pMsrpValue",
                            fieldId: "pMsrpValue",
                            type: "text",
                            multipleValues: false,
                            label: "MsrpValue(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "pFmpOrCrvLabel",
                            fieldId: "pFmpOrCrvLabel",
                            type: "text",
                            multipleValues: false,
                            label: "FmpOrCrvLabel(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "pFmpOrCrvValue",
                            fieldId: "pFmpOrCrvValue",
                            type: "text",
                            multipleValues: false,
                            label: "FmpOrCrvValue(Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "nhtsaRatingOverall",
                            fieldId: "nhtsaRatingOverall",
                            type: "text",
                            multipleValues: false,
                            label: "NhtsaRatingOverall",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "nhtsaRatingRollover",
                            fieldId: "nhtsaRatingRollover",
                            type: "text",
                            multipleValues: false,
                            label: "NhtsaRatingRollover",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "nhtsaRatingFrontDriver",
                            fieldId: "nhtsaRatingFrontDriver",
                            type: "text",
                            multipleValues: false,
                            label: "NhtsaRatingFrontDriver (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "nhtsaRatingFrontPassenger",
                            fieldId: "nhtsaRatingFrontPassenger",
                            type: "text",
                            multipleValues: false,
                            label: "NhtsaRatingFrontPassenger (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "nhtsaRatingFrontSide",
                            fieldId: "nhtsaRatingFrontSide",
                            type: "text",
                            multipleValues: false,
                            label: "NhtsaRatingFrontSide (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "nhtsaRatingRearSide",
                            fieldId: "nhtsaRatingRearSide",
                            type: "text",
                            multipleValues: false,
                            label: "NhtsaRatingRearSide (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "iihsFrontModerateOverlap",
                            fieldId: "iihsFrontModerateOverlap",
                            type: "text",
                            multipleValues: false,
                            label: "IihsFrontModerateOverlap (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "iihsOverallSideCrash",
                            fieldId: "iihsOverallSideCrash",
                            type: "text",
                            multipleValues: false,
                            label: "IihsOverallSideCrash (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "iihsBestPick",
                            fieldId: "iihsBestPick",
                            type: "text",
                            multipleValues: false,
                            label: "IihsBestPick (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "iihsRearCrash",
                            fieldId: "iihsRearCrash",
                            type: "text",
                            multipleValues: false,
                            label: "IihsRearCrash (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "iihsRoofStrength",
                            fieldId: "iihsRoofStrength",
                            type: "text",
                            multipleValues: false,
                            label: "IihsRoofStrength (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "iihsFrontSmallOverlap",
                            fieldId: "iihsFrontSmallOverlap",
                            type: "text",
                            multipleValues: false,
                            label: "IihsFrontSmallOverlap (Non-Jato)",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "depreciationTotal",
                            fieldId: "depreciationTotal",
                            type: "text",
                            multipleValues: false,
                            label: "DepreciationTotal",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "financingTotal",
                            fieldId: "financingTotal",
                            type: "text",
                            multipleValues: false,
                            label: "FinancingTotal",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "insuranceTotal",
                            fieldId: "insuranceTotal",
                            type: "text",
                            multipleValues: false,
                            label: "InsuranceTotal",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "stateFeesTotal",
                            fieldId: "stateFeesTotal",
                            type: "text",
                            multipleValues: false,
                            label: "StateFeesTotal",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "fuelTotal",
                            fieldId: "fuelTotal",
                            type: "text",
                            multipleValues: false,
                            label: "FuelTotal",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "maintenanceTotal",
                            fieldId: "maintenanceTotal",
                            type: "text",
                            multipleValues: false,
                            label: "MaintenanceTotal",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "repairsTotal",
                            fieldId: "repairsTotal",
                            type: "text",
                            multipleValues: false,
                            label: "RepairsTotal",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "total5YearOcCost",
                            fieldId: "total5YearOcCost",
                            type: "text",
                            multipleValues: false,
                            label: "Total5YearOcCost",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "total5YearOcCostLessHybrid",
                            fieldId: "total5YearOcCostLessHybrid",
                            type: "number",
                            multipleValues: false,
                            label: "Total5YearOcCostLessHybrid",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "similarVehicles",
                            fieldId: "similarVehicles",
                            type: "number",
                            multipleValues: false,
                            label: "SimilarVehicles",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "difference5YearCost",
                            fieldId: "difference5YearCost",
                            type: "number",
                            multipleValues: false,
                            label: "Difference5YearCost",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "hybridTax",
                            fieldId: "hybridTax",
                            type: "text",
                            multipleValues: false,
                            label: "HybridTax",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "valueRating",
                            fieldId: "valueRating",
                            type: "text",
                            multipleValues: false,
                            label: "ValueRating",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "usedMonthly",
                            fieldId: "usedMonthly",
                            type: "number",
                            multipleValues: false,
                            label: "UsedMonthly",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "cpoMonthly",
                            fieldId: "cpoMonthly",
                            type: "number",
                            multipleValues: false,
                            label: "CPOMonthly",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "usedMaintenanceRepairs",
                            fieldId: "usedMaintenanceRepairs",
                            type: "number",
                            multipleValues: false,
                            label: "UsedMaintenanceRepairs",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "cpoMaintenanceRepairs",
                            fieldId: "cpoMaintenanceRepairs",
                            type: "number",
                            multipleValues: false,
                            label: "CPOMaintenanceRepairs",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "usedTotalMonthly",
                            fieldId: "usedTotalMonthly",
                            type: "number",
                            multipleValues: false,
                            label: "UsedTotalMonthly",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "cpoTotalMonthly",
                            fieldId: "cpoTotalMonthly",
                            type: "number",
                            multipleValues: false,
                            label: "CPOTotalMonthly",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "cpoYear",
                            fieldId: "cpoYear",
                            type: "number",
                            multipleValues: false,
                            label: "Year",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "cpoMake",
                            fieldId: "cpoMake",
                            type: "text",
                            multipleValues: false,
                            label: "Make",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "modelName",
                            fieldId: "modelName",
                            type: "text",
                            multipleValues: false,
                            label: "ModelName",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "usedCarTrim",
                            fieldId: "usedCarTrim",
                            type: "text",
                            multipleValues: false,
                            label: "UsedCarTrim",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoPrice",
                            fieldId: "cpoPrice",
                            type: "text",
                            multipleValues: false,
                            label: "CPOPrice",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "usedCarPrice",
                            fieldId: "usedCarPrice",
                            type: "number",
                            multipleValues: false,
                            label: "UsedCarPrice",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "vehicleRating",
                            fieldId: "vehicleRating",
                            type: "text",
                            multipleValues: false,
                            label: "VehicleRating",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "vrPerformance",
                            fieldId: "vrPerformance",
                            type: "number",
                            multipleValues: false,
                            label: "Performance",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipPerformance",
                            fieldId: "toolTipPerformance",
                            type: "text",
                            multipleValues: false,
                            label: "ToolTipPerformance",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "overallScore",
                            fieldId: "overallScore",
                            type: "number",
                            multipleValues: false,
                            label: "OverallScore",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipOverallScore",
                            fieldId: "toolTipOverallScore",
                            type: "text",
                            multipleValues: false,
                            label: "ToolTipOverallScore",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "fuelEconomy",
                            fieldId: "fuelEconomy",
                            type: "number",
                            multipleValues: false,
                            label: "fuelEconomy",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipFuelEconomy",
                            fieldId: "toolTipFuelEconomy",
                            type: "text",
                            multipleValues: false,
                            label: "toolTipFuelEconomy",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "techInnovation",
                            fieldId: "techInnovation",
                            type: "number",
                            multipleValues: false,
                            label: "techInnovation",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipTechInnovation",
                            fieldId: "toolTipTechInnovation",
                            type: "text",
                            multipleValues: false,
                            label: "toolTipTechInnovation",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "vrValue",
                            fieldId: "vrValue",
                            type: "number",
                            multipleValues: false,
                            label: "Value",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipValue",
                            fieldId: "toolTipValue",
                            type: "text",
                            multipleValues: false,
                            label: "toolTipValue",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
                id: "recalls",
                fieldId: "recalls",
                multipleValues: true,
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
                        {
                            id: "recallId",
                            fieldId: "recallId",
                            type: "number",
                            multipleValues: false,
                            label: "RecallID",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "recallsCampNumber",
                            fieldId: "recallsCampNumber",
                            type: "text",
                            multipleValues: false,
                            label: "Campno",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "makeText",
                            fieldId: "makeText",
                            type: "text",
                            multipleValues: false,
                            label: "Maketxt",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "modelText",
                            fieldId: "modelText",
                            type: "text",
                            multipleValues: false,
                            label: "Modeltxt",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "yearText",
                            fieldId: "yearText",
                            type: "number",
                            multipleValues: false,
                            label: "Yeartxt",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "compName",
                            fieldId: "compName",
                            type: "text",
                            multipleValues: false,
                            label: "Compname",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "mfgText",
                            fieldId: "mfgText",
                            type: "text",
                            multipleValues: false,
                            label: "Mfgtxt",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "recallsPotaff",
                            fieldId: "recallsPotaff",
                            type: "number",
                            multipleValues: false,
                            label: "Potaff",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "rcDate",
                            fieldId: "rcDate",
                            type: "text",
                            multipleValues: false,
                            label: "Rcdate",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "descDefect",
                            fieldId: "descDefect",
                            type: "text",
                            multipleValues: false,
                            label: "DescDefect",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "consequenceDefect",
                            fieldId: "consequenceDefect",
                            type: "text",
                            multipleValues: false,
                            label: "ConsequenceDefect",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "correctiveAction",
                            fieldId: "correctiveAction",
                            type: "text",
                            multipleValues: false,
                            label: "CorrectiveAction",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
                id: "carsRebates",
                fieldId: "carsRebates",
                multipleValues: true,
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
                        {
                            id: "rebatesExpDate",
                            fieldId: "rebatesExpDate",
                            type: "text",
                            multipleValues: false,
                            label: "ExpDate",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "rebatesLow",
                            fieldId: "rebatesLow",
                            type: "number",
                            multipleValues: false,
                            label: "Low",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "rebatesHigh",
                            fieldId: "rebatesHigh",
                            type: "number",
                            multipleValues: false,
                            label: "High",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "rebateText",
                            fieldId: "rebateText",
                            type: "text",
                            multipleValues: false,
                            label: "RebateText",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "nationallyAvailable",
                            fieldId: "nationallyAvailable",
                            type: "number",
                            multipleValues: false,
                            label: "Nationally Available",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "rebatesDescription",
                            fieldId: "rebatesDescription",
                            type: "text",
                            multipleValues: false,
                            label: "Description",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "cpoName",
                            fieldId: "cpoName",
                            type: "text",
                            multipleValues: false,
                            label: "CpoName",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoInspectionPoint",
                            fieldId: "cpoInspectionPoint",
                            type: "text",
                            multipleValues: false,
                            label: "CPOInspectionPoint",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoInspectionScore",
                            fieldId: "cpoInspectionScore",
                            type: "number",
                            multipleValues: false,
                            label: "CPOInspectionScore",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "cpoAgeMileage",
                            fieldId: "cpoAgeMileage",
                            type: "text",
                            multipleValues: false,
                            label: "CPOAgeMileage",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoWarranty",
                            fieldId: "cpoWarranty",
                            type: "text",
                            multipleValues: false,
                            label: "CPOWarranty",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoWarrantyDeductible",
                            fieldId: "cpoWarrantyDeductible",
                            type: "text",
                            multipleValues: false,
                            label: "CPOWarrantyDeductible",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoWarrantyBbnc",
                            fieldId: "cpoWarrantyBbnc",
                            type: "text",
                            multipleValues: false,
                            label: "CPOWarrantyBbnc",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoWarrantyTransferable",
                            fieldId: "cpoWarrantyTransferable",
                            type: "text",
                            multipleValues: false,
                            label: "CPOWarrantyTransferable",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoWarrantyExtended",
                            fieldId: "cpoWarrantyExtended",
                            type: "text",
                            multipleValues: false,
                            label: "CPOWarrantyExtended",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoRoadside",
                            fieldId: "cpoRoadside",
                            type: "text",
                            multipleValues: false,
                            label: "CPORoadside",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoReturnExchange",
                            fieldId: "cpoReturnExchange",
                            type: "text",
                            multipleValues: false,
                            label: "CPOReturnExchange",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoFinancing",
                            fieldId: "cpoFinancing",
                            type: "text",
                            multipleValues: false,
                            label: "CPOFinancing",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoLease",
                            fieldId: "cpoLease",
                            type: "text",
                            multipleValues: false,
                            label: "CPOLease",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoWebsite",
                            fieldId: "cpoWebsite",
                            type: "text",
                            multipleValues: false,
                            label: "CPOWebsite",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoCustomerServiceNumber",
                            fieldId: "cpoCustomerServiceNumber",
                            type: "text",
                            multipleValues: false,
                            label: "CPOCustomerServiceNumber",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoParticipation",
                            fieldId: "cpoParticipation",
                            type: "text",
                            multipleValues: false,
                            label: "CPOParticipation",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoHistoryReport",
                            fieldId: "cpoHistoryReport",
                            type: "number",
                            multipleValues: false,
                            label: "CPOHistoryReport",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "cpoAdditionalBenefits",
                            fieldId: "cpoAdditionalBenefits",
                            type: "text",
                            multipleValues: false,
                            label: "CPOAdditionalBenefits",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "cpoProgramOverview",
                            fieldId: "cpoProgramOverview",
                            type: "text",
                            multipleValues: false,
                            label: "CPOProgramOverview",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "realmpgAverageMpg",
                            fieldId: "realmpgAverageMpg",
                            type: "number",
                            multipleValues: false,
                            label: "RealmpgAverageMpg",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "realmpgAverageMpgCity",
                            fieldId: "realmpgAverageMpgCity",
                            type: "number",
                            multipleValues: false,
                            label: "RealmpgAverageMpgCity",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "realmpgAverageMpgHwy",
                            fieldId: "realmpgAverageMpgHwy",
                            type: "number",
                            multipleValues: false,
                            label: "RealmpgAverageMpgHwy",
                            renderer: {
                                name: "number-input"
                            }
                        }
                    ]
                }
            },
            {
                id: "hubs",
                fieldId: "hubs",
                multipleValues: true,
                label: "Hubs (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [["hubsImage", "makeModelHub", "hubsName", "hubsText"]],
                    fields: [
                        {
                            id: "hubsImage",
                            fieldId: "hubsImage",
                            type: "text",
                            multipleValues: false,
                            label: "Image",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "makeModelHub",
                            fieldId: "makeModelHub",
                            type: "number",
                            multipleValues: false,
                            label: "MakeModelHub",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "hubsName",
                            fieldId: "hubsName",
                            type: "text",
                            multipleValues: false,
                            label: "Name",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "hubsText",
                            fieldId: "hubsText",
                            type: "text",
                            multipleValues: false,
                            label: "Text",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
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
                        {
                            id: "seoType",
                            fieldId: "seoType",
                            multipleValues: false,
                            type: "text",
                            label: "Type",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "seoTitle",
                            fieldId: "seoTitle",
                            multipleValues: false,
                            type: "text",
                            label: "Title",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "seoContent",
                            fieldId: "seoContent",
                            multipleValues: false,
                            type: "text",
                            label: "Content",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
                id: "images",
                fieldId: "images",
                multipleValues: true,
                label: "Images (Non-Jato)",
                renderer: {
                    name: "objects-accordion"
                },
                type: "object",
                settings: {
                    layout: [["imageUrl"], ["imageAngle", "imageType", "imageOrder"]],
                    fields: [
                        {
                            id: "imageUrl",
                            fieldId: "imageUrl",
                            type: "text",
                            label: "Image Url",
                            renderer: {
                                name: "text-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "imageAngle",
                            fieldId: "imageAngle",
                            type: "text",
                            helpText: "can be front or rear...etc",
                            label: "Image Angle",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "imageType",
                            fieldId: "imageType",
                            type: "text",
                            helpText: "can be exterior or interior",
                            label: "Image Type",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "imageOrder",
                            fieldId: "imageOrder",
                            type: "number",
                            helpText: "can be use for display order",
                            label: "Image Order",
                            renderer: {
                                name: "number-input"
                            }
                        }
                    ]
                }
            },
            {
                id: "featuresIntellicar",
                fieldId: "featuresIntellicar",
                type: "object",
                label: "Features(Non-Jato)",
                multipleValues: false,
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
                        {
                            id: "packageCategory",
                            fieldId: "packageCategory",
                            type: "object",
                            label: "PACKAGE",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "engineCategory",
                            fieldId: "engineCategory",
                            type: "object",
                            label: "ENGINE",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "SequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "transmissionCategory",
                            fieldId: "transmissionCategory",
                            type: "object",
                            label: "TRANSMISSION",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "exteriorColorCategory",
                            fieldId: "exteriorColorCategory",
                            type: "object",
                            label: "EXTERIOR COLOR",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "interiorColorCategory",
                            fieldId: "interiorColorCategory",
                            type: "object",
                            label: "INTERIOR COLOR",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "topColorCategory",
                            fieldId: "topColorCategory",
                            type: "object",
                            label: "TOP COLOR",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "bodyCategory",
                            fieldId: "bodyCategory",
                            type: "object",
                            label: "BODY",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "brakesCategory",
                            fieldId: "brakesCategory",
                            type: "object",
                            label: "BRAKES",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "convenienceCategory",
                            fieldId: "convenienceCategory",
                            type: "object",
                            label: "CONVENIENCE",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "driveCategory",
                            fieldId: "driveCategory",
                            type: "object",
                            label: "DRIVE",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "engineeringCategory",
                            fieldId: "engineeringCategory",
                            type: "object",
                            label: "ENGINEERING",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "exteriorCategory",
                            fieldId: "exteriorCategory",
                            type: "object",
                            label: "EXTERIOR",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "interiorCategory",
                            fieldId: "interiorCategory",
                            type: "object",
                            label: "INTERIOR",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "lightingCategory",
                            fieldId: "lightingCategory",
                            type: "object",
                            label: "LIGHTING",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "mandatoryCategory",
                            fieldId: "mandatoryCategory",
                            type: "object",
                            label: "MANDATORY",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "mirrorsCategory",
                            fieldId: "mirrorsCategory",
                            type: "object",
                            label: "MIRRORS",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "noteCategory",
                            fieldId: "noteCategory",
                            type: "object",
                            label: "NOTE",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "otherCategory",
                            fieldId: "otherCategory",
                            type: "object",
                            label: "OTHER",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "paintCategory",
                            fieldId: "paintCategory",
                            type: "object",
                            label: "PAINT",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "safetyCategory",
                            fieldId: "safetyCategory",
                            type: "object",
                            label: "SAFETY",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "seatsCategory",
                            fieldId: "seatsCategory",
                            type: "object",
                            label: "SEATS",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "soundCategory",
                            fieldId: "soundCategory",
                            type: "object",
                            label: "SOUND",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "specialFeesCreditsOptionsCategory",
                            fieldId: "specialFeesCreditsOptionsCategory",
                            type: "object",
                            label: "SPECIAL FEES CREDITS OPTIONS",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "steeringCategory",
                            fieldId: "steeringCategory",
                            type: "object",
                            label: "STEERING",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "suspensionCategory",
                            fieldId: "suspensionCategory",
                            type: "object",
                            label: "SUSPENSION",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "tiresCategory",
                            fieldId: "tiresCategory",
                            type: "object",
                            label: "TIRES",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "towingCategory",
                            fieldId: "towingCategory",
                            type: "object",
                            label: "TOWING",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "truckBedsCategory",
                            fieldId: "truckBedsCategory",
                            type: "object",
                            label: "TRUCK BEDS",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            id: "wheelsCategory",
                            fieldId: "wheelsCategory",
                            type: "object",
                            label: "WHEELS",
                            multipleValues: true,
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
                                    {
                                        id: "name",
                                        fieldId: "name",
                                        type: "text",
                                        label: "Name",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "availability",
                                        fieldId: "availability",
                                        type: "text",
                                        label: "Availability",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "invoice",
                                        fieldId: "invoice",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "includesNote",
                                        fieldId: "includesNote",
                                        type: "text",
                                        label: "IncludesNote",
                                        renderer: {
                                            name: "text-input"
                                        }
                                    },
                                    {
                                        id: "retail",
                                        fieldId: "retail",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Retail",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "sequenceNmb",
                                        fieldId: "sequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "Invoice",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    },
                                    {
                                        id: "categorySequenceNmb",
                                        fieldId: "categorySequenceNmb",
                                        type: "number",
                                        multipleValues: false,
                                        label: "CategorySequenceNmb",
                                        renderer: {
                                            name: "number-input"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
            {
                id: "vehicleRankingClass",
                fieldId: "vehicleRankingClass",
                type: "object",
                multipleValues: true,
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
                        {
                            id: "classTitle",
                            fieldId: "classTitle",
                            type: "text",
                            label: "ClassTitle",
                            renderer: {
                                name: "text-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "classSlugRedirect",
                            fieldId: "classSlugRedirect",
                            type: "text",
                            label: "ClassSlugRedirect",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "associatedBody",
                            fieldId: "associatedBody",
                            type: "number",
                            label: "AssociatedBody",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "classPosition",
                            fieldId: "classPosition",
                            type: "number",
                            label: "ClassPosition",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "rankClass",
                            fieldId: "rankClass",
                            type: "text",
                            label: "RankClass",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "slugClassTitle",
                            fieldId: "slugClassTitle",
                            type: "text",
                            label: "SlugClassTitle",
                            renderer: {
                                name: "text-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "subclassTitle",
                            fieldId: "subclassTitle",
                            type: "text",
                            label: "SubclassTitle",
                            renderer: {
                                name: "text-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "vrPerformance",
                            fieldId: "vrPerformance",
                            type: "number",
                            label: "Performance",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipPerformance",
                            fieldId: "toolTipPerformance",
                            type: "text",
                            label: "ToolTipPerformance",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "overallScore",
                            fieldId: "overallScore",
                            type: "number",
                            label: "OverallScore",
                            renderer: {
                                name: "number-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "toolTipOverallScore",
                            fieldId: "toolTipOverallScore",
                            type: "text",
                            label: "ToolTipOverallScore",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "fuelEconomy",
                            fieldId: "fuelEconomy",
                            type: "number",
                            label: "fuelEconomy",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipFuelEconomy",
                            fieldId: "toolTipFuelEconomy",
                            type: "text",
                            label: "toolTipFuelEconomy",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "techInnovation",
                            fieldId: "techInnovation",
                            type: "number",
                            label: "techInnovation",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipTechInnovation",
                            fieldId: "toolTipTechInnovation",
                            type: "text",
                            label: "toolTipTechInnovation",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "vrValue",
                            fieldId: "vrValue",
                            type: "number",
                            label: "Value",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "toolTipValue",
                            fieldId: "toolTipValue",
                            type: "text",
                            label: "toolTipValue",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "vrcClassThumbnailRolloverUrl",
                            fieldId: "classThumbnailRolloverUrl",
                            type: "text",
                            label: "Class ThumbnailRolloverUrl",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "vrcClassThumbnailUrl",
                            fieldId: "classThumbnailUrl",
                            type: "text",
                            label: "Class ThumbnailUrl",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "vrcIsMakeBodyStyleVehicleShow",
                            fieldId: "isMakeBodyStyleVehicleShow",
                            type: "number",
                            label: "Is MakeBodyStyle VehicleShow",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "vrcIsRankShow",
                            fieldId: "isRankShow",
                            type: "number",
                            label: "Is RankShow",
                            renderer: {
                                name: "number-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "vrcIsVehicleShow",
                            fieldId: "isVehicleShow",
                            type: "number",
                            label: "Is VehicleShow",
                            renderer: {
                                name: "number-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "vrcRankInSubclassText",
                            fieldId: "rankInSubclassText",
                            type: "text",
                            label: "RankIn SubclassText",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "vrcRankWithinSubclass",
                            fieldId: "rankWithinSubclass",
                            type: "number",
                            label: "RankWithin Subclass",
                            renderer: {
                                name: "number-input"
                            },
                            helpText: "This is a Required Field."
                        },
                        {
                            id: "vrcSubclass",
                            fieldId: "subclass",
                            type: "text",
                            label: "subclass",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "vrcSubclassPosition",
                            fieldId: "subclassPosition",
                            type: "number",
                            label: "Subclass Position",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "vrcTopRankingTrophyImage",
                            fieldId: "topRankingTrophyImage",
                            type: "text",
                            label: "TopRanking Trophy Image",
                            renderer: {
                                name: "text-input"
                            }
                        }
                    ]
                }
            },
            {
                id: "carMatchCustomRankings",
                fieldId: "carMatchCustomRankings",
                multipleValues: true,
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
                        {
                            id: "carMatchBody",
                            fieldId: "carMatchBody",
                            type: "text",
                            multipleValues: false,
                            label: "Body",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "carMatchSeats",
                            fieldId: "carMatchSeats",
                            type: "text",
                            multipleValues: false,
                            label: "Seats",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "carMatchLuxury",
                            fieldId: "carMatchLuxury",
                            type: "text",
                            multipleValues: false,
                            label: "Luxury",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "carMatchGreen",
                            fieldId: "carMatchGreen",
                            type: "text",
                            multipleValues: false,
                            label: "Green",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "carMatchOffroad",
                            fieldId: "carMatchOffroad",
                            type: "text",
                            multipleValues: false,
                            label: "Offroad",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "carMatchBudget",
                            fieldId: "carMatchBudget",
                            type: "text",
                            multipleValues: false,
                            label: "Budget",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "totalPercentage",
                            fieldId: "totalPercentage",
                            type: "number",
                            multipleValues: false,
                            label: "TotalPercentage",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "carMatchPriority",
                            fieldId: "carMatchPriority",
                            type: "number",
                            multipleValues: false,
                            label: "Priority",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "carMatchEstimated",
                            fieldId: "carMatchEstimated",
                            type: "number",
                            multipleValues: false,
                            label: "Estimated",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "priceRange",
                            fieldId: "priceRange",
                            type: "text",
                            multipleValues: false,
                            label: "PriceRange",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "carMatchMpg",
                            fieldId: "carMatchMpg",
                            type: "text",
                            multipleValues: false,
                            label: "Mpg",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "seatingCapacity",
                            fieldId: "seatingCapacity",
                            type: "text",
                            multipleValues: false,
                            label: "SeatingCapacity",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "carMatchHorsepower",
                            fieldId: "carMatchHorsepower",
                            type: "text",
                            multipleValues: false,
                            label: "horsepower",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "winnerDescription",
                            fieldId: "winnerDescription",
                            type: "text",
                            multipleValues: false,
                            label: "WinnerDescription",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "rankWithinSubclass",
                            fieldId: "rankWithinSubclass",
                            type: "number",
                            multipleValues: false,
                            label: "RankWithinSubclass",
                            renderer: {
                                name: "number-input"
                            }
                        },
                        {
                            id: "carMatchSubClassTitle",
                            fieldId: "carMatchSubClassTitle",
                            type: "text",
                            multipleValues: false,
                            label: "SubClassTitle",
                            renderer: {
                                name: "text-input"
                            }
                        },
                        {
                            id: "carMatchUUID",
                            fieldId: "carMatchUUID",
                            type: "number",
                            label: "UUID (PermaLinkID)",
                            renderer: {
                                name: "number-input"
                            }
                        }
                    ]
                }
            }
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
