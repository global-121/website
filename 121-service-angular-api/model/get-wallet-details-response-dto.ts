/**
 * 121-service [DEV]
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: v1.0.0-dev
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { VisaCardActionLink } from './visa-card-action-link';


export interface GetWalletDetailsResponseDto { 
    tokenCode: string;
    status: GetWalletDetailsResponseDto.StatusEnum;
    balance: number;
    issuedDate: string;
    lastUsedDate: object;
    links: Array<VisaCardActionLink>;
    explanation: string;
    spentThisMonth: number;
    maxToSpendPerMonth: number;
    intersolveVisaCardStatus: object;
    intersolveVisaWalletStatus: object;
}
export namespace GetWalletDetailsResponseDto {
    export type StatusEnum = 'Active' | 'Issued' | 'Blocked' | 'Paused' | 'Suspected Fraud' | 'Unknown';
    export const StatusEnum = {
        Active: 'Active' as StatusEnum,
        Issued: 'Issued' as StatusEnum,
        Blocked: 'Blocked' as StatusEnum,
        Paused: 'Paused' as StatusEnum,
        SuspectedFraud: 'Suspected Fraud' as StatusEnum,
        Unknown: 'Unknown' as StatusEnum
    };
}


