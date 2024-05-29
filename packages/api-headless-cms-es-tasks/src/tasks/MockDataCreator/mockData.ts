import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants";

const text =
    "orem ipsum dolor sit amet, consectetur adipiscing elit. Sed augue justo, tempor vel aliquet id, sodales ut est. Morbi sodales lacus lacinia justo molestie, a vulputate ligula ornare. Cras commodo augue sed suscipit auctor. Mauris dapibus vulputate nibh, ultrices porta risus ullamcorper in. Praesent iaculis faucibus tellus, eget egestas mauris ultrices in. Ut dapibus felis id tincidunt tempor. Cras imperdiet lectus et mollis facilisis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Curabitur vitae nulla ut quam cursus viverra ac sed felis. Cras eget nulla nunc. Phasellus facilisis ante in velit tincidunt posuere. Aenean a cursus ex. In a accumsan metus. Nullam faucibus sapien ac pulvinar volutpat. Sed varius sem quis libero pharetra ullamcorper.";

const paragraph = (): string => {
    return text;
};

const paragraphs = (length = 1): string => {
    return Array.from({ length })
        .map(() => paragraph())
        .join("\n");
};

const createMockData = () => {
    return {
        wbyAco_location: {
            folderId: ROOT_FOLDER
        },
        standardTires: "P235/75R15 BSW",
        newUsedBg: "USED",
        ymmMaxPriceRange: 23810,
        carsEditorialRating: null,
        priceRangeSlug: "under-20000",
        specifications: {
            specGvwr: "5,150 lb",
            stdMpgWithUnits: "16/22 mpg",
            specHorsepower: "185@5,600",
            driveTrain: "4WD",
            rearShoulderRoom: "N/A",
            specTonnage: "N/A",
            vehicleClass: "Compact Pickup 4WD",
            cylinderConfiguration: "In-line",
            seatingCapacity: "3/3",
            specWidth: "68.6 in",
            transmissionType: "Manual",
            frontShoulderRoom: "57.1 in",
            heroValue1: "16/22",
            numberOfCylinders: "4",
            specWheelase: "111.3 in",
            rearLegroom: "N/A",
            fuelCapacity: "19.0",
            engineType: "Gas",
            rearHeadroom: "N/A",
            groundClearance: "7.9 in",
            payloadCapacity: "1,535 lb",
            specHeight: "67.6 in",
            stdEpaMpg: "16/22",
            curbWeight: "3,615 lb",
            specTorque: "190@2,800",
            heroLabel1: "MPG",
            frontLegroom: "42.2 in",
            drivingRange: "361 miles",
            specLength: "192.4 in",
            fuelType: "Unleaded Regular",
            engineName: "4-Cyl, 2.9 Liter",
            cargoCapacity: "N/A",
            transmissionName: "5 Speed Manual w/Overdrive",
            frontHeadroom: "39.6 in",
            towingCapacity: "4,000 lb"
        },
        carsVehicle: "Chevrolet-Colorado-2007-LS 4WD Regular Cab",
        marketingImage: null,
        priceRangeText: "Under $20K",
        baseVehicle: 0,
        carsUid: 756335,
        bodyTypeText: "Trucks",
        slugBodyType: "truck",
        carsMakePageShow: 0,
        slugYearMakeModel: "2007/chevrolet/colorado",
        safetyRatings: {
            nhtsaRatingFrontDriver: "4",
            nhtsaRatingRollover: "4",
            nhtsaRatingFrontPassenger: "4",
            iihsBestPick: "0",
            nhtsaRatingRearSide: "No Data",
            iihsOverallSideCrash: "N/R",
            nhtsaRatingOverall: "N/R",
            nhtsaRatingFrontSide: "4",
            iihsFrontModerateOverlap: "N/R",
            iihsFrontSmallOverlap: "N/R",
            iihsRearCrash: "N/R",
            iihsRoofStrength: "N/R"
        },
        bodyStyle: "Truck",
        slugMake: "chevrolet",
        bodyType: "Truck",
        secondaryBodyTypeOrder: null,
        ymmLowestPriceRange: 14085,
        cpoComparison: {
            cpoMake: "Chevrolet",
            cpoYear: 2007,
            cpoTotalMonthly: null,
            usedMonthly: null,
            usedMaintenanceRepairs: null,
            vehicleRating: "N/A",
            cpoMaintenanceRepairs: null,
            usedCarTrim: "LS 4WD Regular Cab",
            usedTotalMonthly: null,
            modelName: "Colorado",
            cpoPrice: "N/R",
            usedCarPrice: null,
            cpoMonthly: null
        },
        secondaryBodyType: null,
        slugHybridElectricCategory: null,
        featuredImage:
            "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-angular-front.png",
        featuresIntellicar: {
            driveCategory: [
                {
                    categorySequenceNmb: 10,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Drivetrain, 4WD",
                    availability: "Std"
                }
            ],
            mirrorsCategory: [
                {
                    categorySequenceNmb: 16,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Dual Manual",
                    availability: "Std"
                }
            ],
            suspensionCategory: [
                {
                    categorySequenceNmb: 25,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Springs, Front, 2755-lb Cap",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 25,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Springs, Rear, 2900-lb Cap",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 25,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Stabilizer Bar, Front",
                    availability: "Std"
                }
            ],
            soundCategory: [
                {
                    categorySequenceNmb: 22,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Radio, AM/FM Stereo",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 22,
                    includesNote: null,
                    invoice: 361.05,
                    sequenceNmb: 1,
                    retail: 435,
                    name: "  Radio, AM/FM Stereo w/CD & MP3",
                    availability: "Opt"
                }
            ],
            engineCategory: [
                {
                    categorySequenceNmb: 2,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Engine: 4-Cyl, 2.9 Liter",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 2,
                    includesNote: null,
                    invoice: 830,
                    sequenceNmb: 1,
                    retail: 1000,
                    name: "  Engine: 5-Cyl, 3.7 Liter",
                    availability: "Opt"
                }
            ],
            packageCategory: [
                {
                    categorySequenceNmb: 1,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Option Pkg",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 1,
                    includesNote: "  INCLUDES:  [**W] Vinyl Seat Trim",
                    invoice: 141.75,
                    sequenceNmb: 1,
                    retail: 150,
                    name: "  Option Pkg, Work Truck",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 1,
                    includesNote: paragraphs(1),
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Street Pack",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 1,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Suspension Pkg, Standard",
                    availability: "Std"
                }
            ],
            otherCategory: [],
            paintCategory: [
                {
                    categorySequenceNmb: 19,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Solid",
                    availability: "Std"
                }
            ],
            specialFeesCreditsOptionsCategory: [
                {
                    categorySequenceNmb: 23,
                    includesNote: null,
                    invoice: 50,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  New Jersey Surcharge",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 23,
                    includesNote: null,
                    invoice: -50,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  New Jersey Surcharge Refund",
                    availability: "Opt"
                }
            ],
            transmissionCategory: [
                {
                    categorySequenceNmb: 3,
                    includesNote: null,
                    invoice: 908.85,
                    sequenceNmb: 1,
                    retail: 1095,
                    name: "  4 Speed Automatic w/Overdrive",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 3,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  5 Speed Manual w/Overdrive",
                    availability: "Std"
                }
            ],
            interiorCategory: [
                {
                    categorySequenceNmb: 13,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Cargo Mat Delete",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 13,
                    includesNote: "  ",
                    invoice: 58.1,
                    sequenceNmb: 1,
                    retail: 70,
                    name: "  Carpeting",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 13,
                    includesNote: null,
                    invoice: 20.75,
                    sequenceNmb: 1,
                    retail: 25,
                    name: "  Floor Mats, Vinyl",
                    availability: "Opt"
                }
            ],
            convenienceCategory: [
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Air Conditioning, Manual",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: "  ",
                    invoice: 601.75,
                    sequenceNmb: 1,
                    retail: 725,
                    name: "  Cargo Cover, Hard",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 211.65,
                    sequenceNmb: 1,
                    retail: 255,
                    name: "  Cargo Cover, Soft",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Clock, Digital (w/Radio)",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Cupholders, (2)",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Driver's Information Center",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Headlamp Control, Automatic",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Mirror, RH Visor Vanity",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Power Outlets, (2)",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Speed Control",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Steering Wheel, Tilt",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 9,
                    includesNote: null,
                    invoice: 145.25,
                    sequenceNmb: 1,
                    retail: 175,
                    name: "  Window, Sliding Rear",
                    availability: "Opt"
                }
            ],
            topColorCategory: [],
            safetyCategory: [
                {
                    categorySequenceNmb: 20,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Lights, Daytime Running",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 20,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Restraint System, Dual Front Air Bag",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 20,
                    includesNote: null,
                    invoice: 327.85,
                    sequenceNmb: 1,
                    retail: 395,
                    name: "  Restraint System, F&R Head Curtain Air Bag",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 20,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Tire Pressure Monitor",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 20,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  W/S Wipers, Intermittent",
                    availability: "Std"
                }
            ],
            truckBedsCategory: [],
            lightingCategory: [],
            bodyCategory: [
                {
                    categorySequenceNmb: 7,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Body, Fleetside",
                    availability: "Std"
                }
            ],
            engineeringCategory: [
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  5150-lb GVWR",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Alternator, 125-Amp",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Axle Ratio, 3.73",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Axle, Front, 2753-lb Cap",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 244.85,
                    sequenceNmb: 1,
                    retail: 295,
                    name: "  Axle, Locking Rear",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Axle, Rear, 2900-lb Cap",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Battery, HD 690-cca",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Fuel Tank, 19.0 Gal Cap",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 41.5,
                    sequenceNmb: 1,
                    retail: 50,
                    name: "  Heater, Engine Block",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Tachometer",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 11,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Transfer Case, Electronic Insta-Trac",
                    availability: "Std"
                }
            ],
            brakesCategory: [
                {
                    categorySequenceNmb: 8,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Power Disc/Drum with 4 Wheel ABS",
                    availability: "Std"
                }
            ],
            exteriorColorCategory: [
                {
                    categorySequenceNmb: 4,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Birch Silver",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Black",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Deep Ruby",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Granite Blue",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Imperial Blue",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Pace Blue",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Summit White",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Sunburst Orange",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Victory Red",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 4,
                    includesNote: null,
                    invoice: 136.95,
                    sequenceNmb: 1,
                    retail: 165,
                    name: "  Yellow",
                    availability: "Opt"
                }
            ],
            noteCategory: [],
            tiresCategory: [
                {
                    categorySequenceNmb: 26,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  P225/75R15 BSW",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 26,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  P235/75R15 BSW",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 26,
                    includesNote: null,
                    invoice: 78.85,
                    sequenceNmb: 1,
                    retail: 95,
                    name: "  Spare Tire, Conventional",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 26,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Spare Tire, Limited Use",
                    availability: "Std"
                }
            ],
            mandatoryCategory: [
                {
                    categorySequenceNmb: 15,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Emission Equipment Override, CA/MA/ME/NY/VT",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 15,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Emission Equipment Override, Federal",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 15,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Emission Equipment, California",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 15,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Emission Equipment, Federal",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 15,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Emission Equipment, MA/ME/NY/VT",
                    availability: "N/C"
                }
            ],
            steeringCategory: [
                {
                    categorySequenceNmb: 24,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Steering, Power",
                    availability: "Std"
                }
            ],
            interiorColorCategory: [
                {
                    categorySequenceNmb: 5,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Medium Pewter",
                    availability: "N/C"
                }
            ],
            towingCategory: [
                {
                    categorySequenceNmb: 27,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Towing Cap, 4000-lb Max (When Properly Equipped)",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 27,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Trailer Harness",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 27,
                    includesNote: "  INCLUDES:  Trailer Harness",
                    invoice: 224.1,
                    sequenceNmb: 1,
                    retail: 270,
                    name: "  Trailer Hitch",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 27,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Trailer Hitch Delete",
                    availability: "Std"
                }
            ],
            wheelsCategory: [],
            exteriorCategory: [
                {
                    categorySequenceNmb: 12,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Bracket, Front License Plate",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Bumpers, Chrome F&R w/Rear Step",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 62.25,
                    sequenceNmb: 1,
                    retail: 75,
                    name: "  Glass, Deep Tinted",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Grille Surround, Dark Smoke Gray",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: "  ",
                    invoice: 83,
                    sequenceNmb: 1,
                    retail: 100,
                    name: "  Moldings, Body Side",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 170.15,
                    sequenceNmb: 1,
                    retail: 205,
                    name: "  Pickup Bed Extender, Brushed Aluminum (Installed by Dealer)",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: "  ",
                    invoice: 112.05,
                    sequenceNmb: 1,
                    retail: 135,
                    name: "  Pickup Box Protectors, Top Rail",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 311.25,
                    sequenceNmb: 1,
                    retail: 375,
                    name: "  Running Boards",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 332,
                    sequenceNmb: 1,
                    retail: 400,
                    name: "  Side Steps, Gray Tubular",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Skid Plate, Front Underbody Shield",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 83,
                    sequenceNmb: 1,
                    retail: 100,
                    name: "  Tailgate Edge Protector",
                    availability: "Opt"
                },
                {
                    categorySequenceNmb: 12,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Wheel Flares, Small F&R",
                    availability: "Std"
                }
            ],
            seatsCategory: [
                {
                    categorySequenceNmb: 21,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Seat Trim, Cloth ",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 21,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Seat Trim, Cloth **D",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 21,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 2,
                    retail: 0,
                    name: "  Seat Trim, Cloth **D",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 21,
                    includesNote: "  ",
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Seat Trim, Vinyl",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 21,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Seat, Split Bench ",
                    availability: "Std"
                },
                {
                    categorySequenceNmb: 21,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 1,
                    retail: 0,
                    name: "  Seat, Split Bench AM6",
                    availability: "N/C"
                },
                {
                    categorySequenceNmb: 21,
                    includesNote: null,
                    invoice: 0,
                    sequenceNmb: 2,
                    retail: 0,
                    name: "  Seat, Split Bench AM6",
                    availability: "N/C"
                }
            ]
        },
        vehicleRankingClass: [],
        slugMakeModel: null,
        secondaryBodyTypeText: null,
        latestYear: 0,
        ownershipCosts: {
            depreciationTotal: "N/A",
            total5YearOcCostLessHybrid: null,
            total5YearOcCost: "N/A",
            valueRating: "N/A",
            repairsTotal: "N/A",
            hybridTax: "N/A",
            stateFeesTotal: "N/A",
            fuelTotal: "N/A",
            maintenanceTotal: "N/A",
            similarVehicles: null,
            financingTotal: "N/A",
            difference5YearCost: null,
            insuranceTotal: "N/A"
        },
        carsMake: "Chevrolet",
        carsYear: 2007,
        slugModelName: "colorado",
        mainCategory: "Utility/Offroad",
        vehicleStatus: 1,
        vehicleNmb: 19335,
        slugDieselCategory: null,
        warranty: {
            roadsideWarrantyMonths: null,
            fullWarrantyMiles: "36,000",
            powertrainWarrantyMiles: "100,000",
            corrosionWarrantyMonths: "72",
            powertrainWarrantyMonths: "60",
            corrosionWarrantyMiles: "100,000",
            maintenanceWarrantyMonths: "None",
            fullWarrantyMonths: "36",
            maintenanceWarrantyMiles: "None",
            roadsideWarrantyMiles: "N/A"
        },
        makeDiscontinued: 0,
        slugSubcategory: "midsize-pickup",
        makeIcon: "chevrolet.png",
        slugSecondaryBodyType: null,
        makeFeaturedImage: "chevy.jpg",
        carsRebates: [],
        pricing: {
            pMsrpValue: "17485.00",
            pExcellentRetailValue: null,
            pFmpOrCrvLabel: "Clean Retail Value",
            pMsrp: 17485,
            pTotalTargetPrice: 0,
            pTargetPrice: 0,
            pGasGuzzlerTax: 0,
            pMsrpLabel: "Original MSRP",
            pNewMonthly: 0,
            pAverageSalesTaxAndFees: 0,
            pCpoPrice: "N/R",
            pFmpOrCrvValue: "N/A",
            pInvoice: 16523.33,
            pTargetRebate: 0,
            pEffectiveOn: "2007-03-26T00:00:00.000Z",
            pDestination: 685
        },
        recalls: [
            {
                recallsPotaff: 3227,
                correctiveAction: paragraphs(2),
                yearText: 2007,
                rcDate: "2006-08-11T00:00:00.000Z",
                mfgText: "GENERAL MOTORS CORP.",
                makeText: "CHEVROLET",
                modelText: "COLORADO",
                consequenceDefect: paragraphs(2),
                descDefect: paragraphs(3),
                recallsCampNumber: "06V307000",
                recallId: 63244,
                compName: "WHEELS:RIM "
            },
            {
                recallsPotaff: 42540,
                correctiveAction: paragraphs(1),
                yearText: 2007,
                rcDate: "2009-05-11T00:00:00.000Z",
                mfgText: "DOPE, INC.",
                makeText: "CHEVROLET",
                modelText: "S10",
                consequenceDefect: paragraph(),
                descDefect: paragraphs(4),
                recallsCampNumber: "09E025000",
                recallId: 102448,
                compName: "EXTERIOR LIGHTING:HEADLIGHTS"
            },
            {
                recallsPotaff: 185903,
                correctiveAction: paragraphs(4),
                yearText: 2007,
                rcDate: "2009-07-29T00:00:00.000Z",
                mfgText: "GENERAL MOTORS CORP.",
                makeText: "CHEVROLET",
                modelText: "COLORADO",
                consequenceDefect: paragraphs(2),
                descDefect: paragraphs(2),
                recallsCampNumber: "09V310000",
                recallId: 102549,
                compName: "EXTERIOR LIGHTING:BRAKE LIGHTS:SWITCH"
            },
            {
                recallsPotaff: 192676,
                correctiveAction: paragraphs(2),
                yearText: 2007,
                rcDate: "2010-11-18T00:00:00.000Z",
                mfgText: "GENERAL MOTORS CORP.",
                makeText: "CHEVROLET",
                modelText: "COLORADO",
                consequenceDefect: paragraphs(6),
                descDefect: paragraphs(2),
                recallsCampNumber: "10V575000",
                recallId: 121363,
                compName: "CHILD SEAT"
            }
        ],
        cpoProgram: {
            cpoWarrantyBbnc: paragraph(),
            cpoInspectionPoint: "172",
            cpoWebsite: "https://www.gmcertified.com",
            cpoAdditionalBenefits: paragraphs(2),
            cpoAgeMileage: "6 model years or newer/less than 75,000 miles",
            cpoName: "Chevrolet/Buick/GMC Certified Pre-Owned Vehicles",
            cpoLease: "No",
            cpoCustomerServiceNumber: "(866) 694-6546",
            cpoInspectionScore: 99,
            cpoWarranty: paragraphs(2),
            cpoReturnExchange: "3-day/150-mile Vehicle Exchange Program",
            cpoFinancing: "Yes",
            cpoWarrantyExtended: "Yes",
            cpoHistoryReport: 1,
            cpoParticipation: "3,400 dealerships enrolled (94% of available dealerships)",
            cpoProgramOverview: paragraphs(6),
            cpoWarrantyDeductible: "No",
            cpoWarrantyTransferable: "Yes",
            cpoRoadside: "6 years/100,000 miles (full term of Certified Powertrain Warranty)."
        },
        priceRangeValue: 1,
        dieselCategory: null,
        carsPricePageShow: 0,
        combinedPrice: 18170,
        carsSubcategory: "Midsize Pickup",
        hubs: [
            {
                hubsImage: "epa.svg",
                hubsText: "16 / 22 mpg",
                makeModelHub: 1,
                hubsName: "Fuel Economy"
            },
            {
                hubsImage: "engine.svg",
                hubsText: "185@5,600",
                makeModelHub: 2,
                hubsName: "Horsepower"
            },
            {
                hubsImage: "torque.svg",
                hubsText: "190@2,800",
                makeModelHub: 3,
                hubsName: "Torque"
            },
            {
                hubsImage: null,
                hubsText: null,
                makeModelHub: 4,
                hubsName: null
            }
        ],
        carsDiscontinued: 0,
        updatedOn: "2024-01-08T17:09:18.000Z",
        retainedValue: "N/A",
        carMatchCustomRankings: [],
        carsModelName: "Colorado",
        makeThumbnailUrl: "https://mocks.webiny.com/chevrolet.png",
        slugBodystyle: "truck",
        slugMainCategory: "utilityoffroad",
        powertrains: [
            {
                ptCityMpg: 15,
                ptHwyMpg: 21,
                ptHorseower: 185
            },
            {
                ptCityMpg: 15,
                ptHwyMpg: 21,
                ptHorseower: 242
            },
            {
                ptCityMpg: 16,
                ptHwyMpg: 22,
                ptHorseower: 185
            }
        ],
        trimName: "LS 4WD Regular Cab",
        carsCombinedEpaMpg: 18.7,
        releaseType: "Complete",
        ymmPriceRange: "$14,085 - $23,810",
        seoText: {
            seoContent: paragraphs(5),
            seoTitle: "Chevrolet Trucks",
            seoType: "truck"
        },
        slugTrimName: "ls-4wd-regular-cab",
        oemUrl: "www.chevrolet.com",
        propertyType: "Standard",
        bodyTypeOrder: 3,
        horsePowerVal: 185,
        images: [
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-angular-front.png",
                imageAngle: "angular front",
                imageOrder: 1,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-angular-rear.png",
                imageAngle: "angular rear",
                imageOrder: 2,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-dashboard.png",
                imageAngle: "dashboard",
                imageOrder: 3,
                imageType: "interior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-side-view.png",
                imageAngle: "side view",
                imageOrder: 4,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-wheel-cap.png",
                imageAngle: "wheel cap",
                imageOrder: 5,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-front-view.png",
                imageAngle: "front view",
                imageOrder: 6,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-rear-view.png",
                imageAngle: "rear view",
                imageOrder: 7,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-steering-wheel.png",
                imageAngle: "steering wheel",
                imageOrder: 8,
                imageType: "interior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-instrument-cluster.png",
                imageAngle: "instrument cluster",
                imageOrder: 9,
                imageType: "interior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-front-seat.png",
                imageAngle: "front seat",
                imageOrder: 11,
                imageType: "interior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-rear-seat.png",
                imageAngle: "rear seat",
                imageOrder: 12,
                imageType: "interior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-instrument-panel.png",
                imageAngle: "instrument panel",
                imageOrder: 13,
                imageType: "interior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-grille.png",
                imageAngle: "grille",
                imageOrder: 15,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-headlight.png",
                imageAngle: "headlight",
                imageOrder: 16,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-taillight.png",
                imageAngle: "taillight",
                imageOrder: 17,
                imageType: "exterior"
            },
            {
                imageUrl: "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-doors.png",
                imageAngle: "doors",
                imageOrder: 18,
                imageType: "exterior"
            },
            {
                imageUrl: "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-trunk.png",
                imageAngle: "trunk",
                imageOrder: 19,
                imageType: "exterior"
            },
            {
                imageUrl:
                    "https://mocks.webiny.com/2007-chevrolet-colorado-ls-2wd-truck-door-controls.png",
                imageAngle: "door controls",
                imageOrder: 22,
                imageType: "interior"
            }
        ],
        hybridElectricCategory: null,
        manufacturerCd: "CT15403"
    };
};

export const mockData = createMockData();
