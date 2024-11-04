import {
  CustomDataAttributes,
  FinancialServiceProviderName,
} from './custom-data-attributes.js';

export const registrationVisa = {
  referenceId: 'registration-visa-1',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  fullName: 'Jane Doe',
  [CustomDataAttributes.phoneNumber]: '14155238887',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviderName.intersolveVisa,
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
  [CustomDataAttributes.whatsappPhoneNumber]: '14155238887',
};

export const registrationSafaricom = {
  referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
  programFinancialServiceProviderConfigurationName:
    FinancialServiceProviderName.safaricom,
  phoneNumber: '254708374149',
  preferredLanguage: 'en',
  paymentAmountMultiplier: 1,
  maxPayments: 6,
  fullName: 'Barbara Floyd',
  gender: 'male',
  age: 25,
  maritalStatus: 'married',
  registrationType: 'self',
  nationalId: '32121321',
  nameAlternate: 'test',
  totalHH: 56,
  totalSub5: 1,
  totalAbove60: 1,
  otherSocialAssistance: 'no',
  county: 'ethiopia',
  subCounty: 'ethiopia',
  ward: 'dsa',
  location: '21',
  subLocation: '2113',
  village: 'adis abea',
  nearestSchool: '213321',
  areaType: 'urban',
  mainSourceLivelihood: 'salary_from_formal_employment',
  mainSourceLivelihoodOther: '213',
  Male05: 1,
  Female05: 0,
  Male612: 0,
  Female612: 0,
  Male1324: 0,
  Female1324: 0,
  Male2559: 0,
  Female2559: 0,
  Male60: 0,
  Female60: 0,
  maleTotal: 0,
  femaleTotal: 0,
  householdMembersDisability: 'no',
  disabilityAmount: 0,
  householdMembersChronicIllness: 'no',
  chronicIllnessAmount: 0,
  householdMembersPregnantLactating: 'no',
  pregnantLactatingAmount: 0,
  habitableRooms: 0,
  tenureStatusOfDwelling: 'Owner occupied',
  ownerOccupiedState: 'purchased',
  ownerOccupiedStateOther: '0',
  rentedFrom: 'individual',
  rentedFromOther: '0',
  constructionMaterialRoof: 'tin',
  ifRoofOtherSpecify: '31213',
  constructionMaterialWall: 'tiles',
  ifWallOtherSpecify: '231312',
  constructionMaterialFloor: 'cement',
  ifFloorOtherSpecify: 'asdsd',
  dwellingRisk: 'fire',
  ifRiskOtherSpecify: '123213',
  mainSourceOfWater: 'lake',
  ifWaterOtherSpecify: 'dasdas',
  pigs: 'no',
  ifYesPigs: 123123,
  chicken: 'no',
  mainModeHumanWasteDisposal: 'septic_tank',
  ifHumanWasteOtherSpecify: '31213',
  cookingFuel: 'electricity',
  ifFuelOtherSpecify: 'asdsda',
  Lighting: 'electricity',
  ifLightingOtherSpecify: 'dasasd',
  householdItems: 'none',
  excoticCattle: 'no',
  ifYesExoticCattle: 12231123,
  IndigenousCattle: 'no',
  ifYesIndigenousCattle: 123132123,
  sheep: 'no',
  ifYesSheep: 12312312,
  goats: 'no',
  ifYesGoats: 312123,
  camels: 'no',
  ifYesCamels: 312123,
  donkeys: 'no',
  ifYesDonkeys: 213312,
  ifYesChicken: 2,
  howManyBirths: 0,
  howManyDeaths: 0,
  householdConditions: 'poor',
  skipMeals: 'no',
  receivingBenefits: '0',
  ifYesNameProgramme: '0',
  typeOfBenefit: 'in_kind',
  ifOtherBenefit: '2123312',
  ifCash: '12312',
  ifInKind: '132132',
  feedbackOnRespons: 'no',
  ifYesFeedback: '312123',
  whoDecidesHowToSpend: 'male_household_head',
  possibilityForConflicts: 'no',
  genderedDivision: 'no',
  ifYesElaborate: 'asddas',
  geopoint: '123231',
};
