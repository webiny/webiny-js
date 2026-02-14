import { CmsGroupPlugin, CmsModelPlugin } from "~/index";

export const createCarsModel = () => {
    return [
        new CmsGroupPlugin({
            id: "buyersguide",
            name: "BuyersGuide",
            slug: "buyers-guide",
            icon: "fas/car",
            description: "Cars BuyersGuide Model"
        }),

        new CmsModelPlugin({
            //
            name: "Cars",
            modelId: "cars",
            description: "Buyers Guide Cars Data Model",
            group: {
                id: "buyersguide",
                name: "BuyersGuide"
            },
            fields: [
                {
                    id: "carsVehicle",
                    fieldId: "carsVehicle",
                    type: "text",
                    label: "Vehicle",
                    help: "Make Model Year and Trim",
                    renderer: { name: "text-input" },
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
                    help: "A unique vehicle number",
                    renderer: { name: "text-input" },
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
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsMake",
                    fieldId: "carsMake",
                    type: "text",
                    label: "Make",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsModelName",
                    fieldId: "carsModelName",
                    type: "text",
                    label: "ModelName",
                    renderer: { name: "text-input" }
                },
                {
                    id: "manufacturerCd",
                    fieldId: "manufacturerCd",
                    type: "text",
                    label: "Manufacturer Code",
                    renderer: { name: "text-input" }
                },
                {
                    id: "releaseType",
                    fieldId: "releaseType",
                    type: "text",
                    label: "ReleaseType (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "newUsedBg",
                    fieldId: "newUsedBg",
                    type: "text",
                    label: "NewUsedBg (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsUid",
                    fieldId: "carsUid",
                    type: "number",
                    label: "UID",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsDiscontinued",
                    fieldId: "carsDiscontinued",
                    type: "number",
                    label: "Discontinued",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugMake",
                    fieldId: "slugMake",
                    type: "text",
                    label: "Slug Make",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugModelName",
                    fieldId: "slugModelName",
                    type: "text",
                    label: "SlugModelName",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugTrimName",
                    fieldId: "slugTrimName",
                    type: "text",
                    label: "SlugTrimName (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugBodystyle",
                    fieldId: "slugBodystyle",
                    type: "text",
                    label: "SlugBodystyle (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "makeFeaturedImage",
                    fieldId: "makeFeaturedImage",
                    type: "text",
                    label: "MakeFeaturedImage (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "makeIcon",
                    fieldId: "makeIcon",
                    type: "text",
                    label: "MakeIcon (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "makeDiscontinued",
                    fieldId: "makeDiscontinued",
                    type: "number",
                    label: "Make Discontinued",
                    renderer: { name: "text-input" }
                },
                {
                    id: "baseVehicle",
                    fieldId: "baseVehicle",
                    type: "number",
                    label: "BaseVehicle (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "oemUrl",
                    fieldId: "oemUrl",
                    type: "text",
                    label: "OemUrl (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsSubcategory",
                    fieldId: "carsSubcategory",
                    type: "text",
                    label: "Subcategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugSubcategory",
                    fieldId: "slugSubcategory",
                    type: "text",
                    label: "SlugSubcategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "mainCategory",
                    fieldId: "mainCategory",
                    type: "text",
                    label: "MainCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugMainCategory",
                    fieldId: "slugMainCategory",
                    type: "text",
                    label: "SlugMainCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "hybridElectricCategory",
                    fieldId: "hybridElectricCategory",
                    type: "text",
                    label: "HybridElectricCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugHybridElectricCategory",
                    fieldId: "slugHybridElectricCategory",
                    type: "text",
                    label: "SlugHybridElectricCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "dieselCategory",
                    fieldId: "dieselCategory",
                    type: "text",
                    label: "DieselCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugDieselCategory",
                    fieldId: "slugDieselCategory",
                    type: "text",
                    label: "SlugDieselCategory (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "updatedOn",
                    fieldId: "updatedOn",
                    type: "text",
                    label: "UpdatedOn",
                    renderer: { name: "text-input" }
                },
                {
                    id: "vehicleStatus",
                    fieldId: "vehicleStatus",
                    type: "number",
                    label: "VehicleStatus (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "featuredImage",
                    fieldId: "featuredImage",
                    type: "text",
                    label: "FeaturedImage (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "propertyType",
                    fieldId: "propertyType",
                    type: "text",
                    label: "PropertyType (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "marketingImage",
                    fieldId: "marketingImage",
                    type: "text",
                    label: "MarketingImage (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "priceRangeValue",
                    fieldId: "priceRangeValue",
                    type: "number",
                    label: "PriceRangeValue (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "priceRangeText",
                    fieldId: "priceRangeText",
                    type: "text",
                    label: "PriceRangeText (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "ymmPriceRange",
                    fieldId: "ymmPriceRange",
                    type: "text",
                    label: "YMMPriceRange (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "bodyType",
                    fieldId: "bodyType",
                    type: "text",
                    label: "BodyType",
                    renderer: { name: "text-input" }
                },
                {
                    id: "bodyTypeText",
                    fieldId: "bodyTypeText",
                    type: "text",
                    label: "BodyType Text",
                    renderer: { name: "text-input" }
                },
                {
                    id: "bodyTypeOrder",
                    fieldId: "bodyTypeOrder",
                    type: "number",
                    label: "BodyTypeOrder (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "secondaryBodyType",
                    fieldId: "secondaryBodyType",
                    type: "text",
                    label: "SecondaryBodyType (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "secondaryBodyTypeText",
                    fieldId: "secondaryBodyTypeText",
                    type: "text",
                    label: "SecondaryBodyTypeText (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "secondaryBodyTypeOrder",
                    fieldId: "secondaryBodyTypeOrder",
                    type: "number",
                    label: "SecondaryBodyTypeOrder (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "priceRangeSlug",
                    fieldId: "priceRangeSlug",
                    type: "text",
                    label: "PriceRangeSlug (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "latestYear",
                    fieldId: "latestYear",
                    type: "number",
                    label: "LatestYear (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "ymmLowestPriceRange",
                    fieldId: "ymmLowestPriceRange",
                    type: "number",
                    label: "YMMLowestPriceRange (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "ymmMaxPriceRange",
                    fieldId: "ymmMaxPriceRange",
                    type: "number",
                    label: "YMMMaxPriceRange (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "makeThumbnailUrl",
                    fieldId: "makeThumbnailUrl",
                    type: "text",
                    label: "MakeThumbnailUrl (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "combinedPrice",
                    fieldId: "combinedPrice",
                    type: "number",
                    label: "CombinedPrice (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "carsCombinedEpaMpg",
                    fieldId: "carsCombinedEpaMpg",
                    type: "number",
                    label: "CombinedEpaMPG (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "horsePowerVal",
                    fieldId: "horsePowerVal",
                    type: "number",
                    label: "HorsePowerVal (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "slugMakeModel",
                    fieldId: "slugMakeModel",
                    type: "text",
                    label: "SlugMakeModel (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "retainedValue",
                    fieldId: "retainedValue",
                    type: "text",
                    label: "RetainedValue (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "standardTires",
                    fieldId: "standardTires",
                    type: "text",
                    label: "StandardTires (non-jato)",
                    renderer: { name: "text-input" }
                },
                {
                    id: "features",
                    fieldId: "features",
                    type: "object",
                    label: "Features",
                    list: false,
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["exteriorCategory"],
                            ["interiorCategory"],
                            ["comfortAndConvenienceCategory"],
                            ["dimensionsCategory"],
                            ["engineCategory"],
                            ["fuelEconomyCategory"],
                            ["hybridAndElectricCategory"],
                            ["infotainmentCategory"],
                            ["pricingCategory"],
                            ["safetyAndDriverAssistCategory"],
                            ["suspensionCategory"],
                            ["transmissionCategory"],
                            ["warrantyCategory"]
                        ],
                        fields: [
                            {
                                id: "exteriorCategory",
                                fieldId: "exteriorCategory",
                                type: "object",
                                label: "Exterior",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "interiorCategory",
                                fieldId: "interiorCategory",
                                type: "object",
                                label: "Interior",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "comfortAndConvenienceCategory",
                                fieldId: "comfortAndConvenienceCategory",
                                type: "object",
                                label: "Comfort & Convenience",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "dimensionsCategory",
                                fieldId: "dimensionsCategory",
                                type: "object",
                                label: "Dimensions",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "engineCategory",
                                fieldId: "engineCategory",
                                type: "object",
                                label: "Engine",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "fuelEconomyCategory",
                                fieldId: "fuelEconomyCategory",
                                type: "object",
                                label: "Fuel Economy",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "hybridAndElectricCategory",
                                fieldId: "hybridAndElectricCategory",
                                type: "object",
                                label: "Hybrid & Electric",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "infotainmentCategory",
                                fieldId: "infotainmentCategory",
                                type: "object",
                                label: "Infotainment",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "pricingCategory",
                                fieldId: "pricingCategory",
                                type: "object",
                                label: "Pricing",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "safetyAndDriverAssistCategory",
                                fieldId: "safetyAndDriverAssistCategory",
                                type: "object",
                                label: "Safety & Driver Assist",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "suspensionCategory",
                                fieldId: "suspensionCategory",
                                type: "object",
                                label: "Suspension",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "transmissionCategory",
                                fieldId: "transmissionCategory",
                                type: "object",
                                label: "Transmission",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            },
                            {
                                id: "warrantyCategory",
                                fieldId: "warrantyCategory",
                                type: "object",
                                label: "Warranty",
                                list: false,
                                renderer: { name: "object" },
                                settings: {
                                    layout: ["nameAndAvailability"],
                                    fields: [
                                        {
                                            id: "nameAndAvailability",
                                            fieldId: "nameAndAvailability",
                                            type: "text",
                                            list: true,
                                            label: "Name : Availability",
                                            renderer: { name: "text-inputs" }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                },
                {
                    id: "specifications",
                    fieldId: "specifications",
                    type: "object",
                    label: "Specifications",
                    renderer: { name: "object" },
                    settings: {
                        layout: [
                            ["trimName", "bodyStyle", "driveTrain"],
                            ["seatingCapacity", "specWidth", "specLength"],
                            ["specHeight", "specWheelase", "frontHeadroom"],
                            ["rearHeadroom", "frontShoulderRoom", "rearShoulderRoom"],
                            ["frontLegroom", "rearLegroom", "groundClearance"],
                            ["curbWeight", "cargoCapacity", "specGvwr"],
                            ["engineName", "specHorsepower", "specTonnage"],
                            ["specTorque", "fuelType", "stdEpaMpg"],
                            ["transmissionName", "transmissionType", "towingCapacity"],
                            ["drivingRange", "cylinderConfiguration", "numberOfCylinders"],
                            ["stdMpgWithUnits", "heroLabel1", "heroValue1"],
                            ["payloadCapacity", "vehicleClass", "engineType"]
                        ],
                        fields: [
                            {
                                id: "trimName",
                                fieldId: "trimName",
                                type: "text",
                                label: "TrimName",
                                list: false,
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "bodyStyle",
                                fieldId: "bodyStyle",
                                list: false,
                                type: "text",
                                label: "BodyStyle",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "driveTrain",
                                fieldId: "driveTrain",
                                list: false,
                                type: "text",
                                label: "Drivetrain",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "seatingCapacity",
                                fieldId: "seatingCapacity",
                                list: false,
                                type: "text",
                                label: "SeatingCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specWidth",
                                fieldId: "specWidth",
                                list: false,
                                type: "text",
                                label: "Width",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specLength",
                                fieldId: "specLength",
                                list: false,
                                type: "text",
                                label: "Length",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specHeight",
                                fieldId: "specHeight",
                                list: false,
                                type: "text",
                                label: "Height",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specWheelase",
                                fieldId: "specWheelbase",
                                type: "text",
                                list: false,
                                label: "Wheelbase",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "frontHeadroom",
                                fieldId: "frontHeadroom",
                                type: "text",
                                list: false,
                                label: "FrontHeadroom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearHeadroom",
                                fieldId: "rearHeadroom",
                                type: "text",
                                list: false,
                                label: "RearHeadroom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "frontShoulderRoom",
                                fieldId: "frontShoulderRoom",
                                type: "text",
                                list: false,
                                label: "FrontShoulderRoom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearShoulderRoom",
                                fieldId: "rearShoulderRoom",
                                type: "text",
                                list: false,
                                label: "RearShoulderRoom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "frontLegroom",
                                fieldId: "frontLegroom",
                                type: "text",
                                list: false,
                                label: "FrontLegroom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "rearLegroom",
                                fieldId: "rearLegroom",
                                type: "text",
                                list: false,
                                label: "RearLegroom",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "groundClearance",
                                fieldId: "groundClearance",
                                type: "text",
                                list: false,
                                label: "GroundClearance",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "curbWeight",
                                fieldId: "curbWeight",
                                type: "text",
                                list: false,
                                label: "CurbWeight",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cargoCapacity",
                                fieldId: "cargoCapacity",
                                type: "text",
                                list: false,
                                label: "CargoCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specGvwr",
                                fieldId: "specGvwr",
                                type: "text",
                                list: false,
                                label: "GVWR",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "payloadCapacity",
                                fieldId: "payloadCapacity",
                                type: "text",
                                list: false,
                                label: "PayloadCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "towingCapacity",
                                fieldId: "towingCapacity",
                                type: "text",
                                list: false,
                                label: "TowingCapacity",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "engineName",
                                fieldId: "engineName",
                                type: "text",
                                list: false,
                                label: "EngineName",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specHorsepower",
                                fieldId: "specHorsepower",
                                type: "text",
                                list: false,
                                label: "Horsepower",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specTorque",
                                fieldId: "specTorque",
                                type: "text",
                                list: false,
                                label: "Torque",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "fuelType",
                                fieldId: "fuelType",
                                list: false,
                                type: "text",
                                label: "FuelType",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "stdEpaMpg",
                                fieldId: "stdEpaMpg",
                                type: "text",
                                list: false,
                                label: "StdEpaMpg",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "transmissionName",
                                fieldId: "transmissionName",
                                type: "text",
                                list: false,
                                label: "TransmissionName",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "transmissionType",
                                fieldId: "transmissionType",
                                type: "text",
                                list: false,
                                label: "TransmissionType",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "drivingRange",
                                fieldId: "drivingRange",
                                type: "text",
                                list: false,
                                label: "DrivingRange",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "cylinderConfiguration",
                                fieldId: "cylinderConfiguration",
                                type: "text",
                                list: false,
                                label: "CylinderConfiguration",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "numberOfCylinders",
                                fieldId: "numberOfCylinders",
                                type: "text",
                                list: false,
                                label: "NumberOfCylinders",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "specTonnage",
                                fieldId: "specTonnage",
                                type: "text",
                                list: false,
                                label: "Tonnage",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "stdMpgWithUnits",
                                fieldId: "stdMpgWithUnits",
                                type: "text",
                                list: false,
                                label: "StdMpg With Units",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "heroLabel1",
                                fieldId: "heroLabel1",
                                type: "text",
                                list: false,
                                label: "Hero Label1",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "heroValue1",
                                fieldId: "heroValue1",
                                type: "text",
                                list: false,
                                label: "Hero Value1",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "vehicleClass",
                                fieldId: "vehicleClass",
                                type: "text",
                                list: false,
                                label: "VehicleClass",
                                renderer: { name: "text-input" }
                            },
                            {
                                id: "engineType",
                                fieldId: "engineType",
                                type: "text",
                                list: false,
                                label: "Engine Type",
                                renderer: { name: "text-input" }
                            }
                        ]
                    }
                }
            ],
            layout: [
                ["carsVehicle"],
                ["vehicleNmb", "carsUid", "carsDiscontinued"],
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
                ["ymmPriceRange", "bodyType", "bodyTypeText"],
                ["bodyTypeOrder", "secondaryBodyType", "secondaryBodyTypeText"],
                ["secondaryBodyTypeOrder", "priceRangeSlug", "latestYear"],
                ["ymmLowestPriceRange", "ymmMaxPriceRange", "makeThumbnailUrl"],
                ["combinedPrice", "carsCombinedEpaMpg", "horsePowerVal"],
                ["slugMakeModel", "retainedValue", "standardTires"],
                ["specifications"],
                ["features"]
            ],
            titleFieldId: "carsVehicle"
        })
    ];
};
