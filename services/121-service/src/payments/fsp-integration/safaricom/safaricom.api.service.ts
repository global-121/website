import { Injectable } from '@nestjs/common';
import { TokenSet } from 'openid-client';

import { AuthResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/auth-response-safaricom-api.dto';
import { TransferRequestSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-request-safaricom-api.dto';
import { TransferResponseSafaricomApiDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-response-safaricom-api.dto';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-api.error';
import { CustomHttpService } from '@121-service/src/shared/services/custom-http.service';

const callbackBaseUrl = process.env.EXTERNAL_121_SERVICE_URL + 'api/';
const safaricomTimeoutCallbackUrl = `${callbackBaseUrl}financial-service-providers/safaricom/timeout-callback`;
const safaricomTransferCallbacktUrl = `${callbackBaseUrl}financial-service-providers/safaricom/transfer-callback`;

@Injectable()
export class SafaricomApiService {
  public tokenSet: TokenSet | null;

  public constructor(private readonly httpService: CustomHttpService) {}

  public async sendTransferAndHandleResponse(
    transferData: DoTransferParams,
  ): Promise<TransferResponseSafaricomApiDto> {
    await this.authenticate();
    const payload = this.createTransferPayload(transferData);
    const transferResponse = await this.transfer(payload);

    let errorMessage: string | undefined;

    if (!transferResponse || !transferResponse.data) {
      errorMessage = `Error: No response data from Safaricom API`;
    } else if (transferResponse.data.errorCode) {
      errorMessage = `${transferResponse.data.errorCode} - ${transferResponse.data.errorMessage}`;
    } else if (!transferResponse.data.ResponseCode) {
      errorMessage = `Error: ${(transferResponse.data as any)?.statusCode} ${(transferResponse.data as any)?.error}`;
    } else if (transferResponse.data.ResponseCode !== '0') {
      errorMessage = transferResponse.data?.ResponseDescription;
    }

    if (errorMessage) {
      throw new SafaricomApiError(errorMessage);
    }

    // All the checks above mean that at this stage transferResponse.data.ResponseCode === '0'
    return transferResponse;
  }

  private async authenticate(): Promise<string | undefined> {
    const consumerKey = process.env.SAFARICOM_CONSUMER_KEY;
    const consumerSecret = process.env.SAFARICOM_CONSUMER_SECRET;
    const accessTokenUrl = !!process.env.MOCK_SAFARICOM
      ? `${process.env.MOCK_SERVICE_URL}api/fsp/safaricom/authenticate`
      : `${process.env.SAFARICOM_API_URL}/oauth/v1/generate?grant_type=client_credentials`;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
      'base64',
    );

    this.tokenSet = null;

    try {
      const headers = [{ name: 'Authorization', value: `Basic ${auth}` }];

      const { data } = await this.httpService.get<AuthResponseSafaricomApiDto>(
        `${accessTokenUrl}`,
        headers,
      );

      const datetime = new Date();
      // Cache tokenSet and expires_at
      const tokenSet = new TokenSet({
        access_token: data.access_token,
        expires_at: datetime.setMinutes(datetime.getMinutes() + 55),
      });

      this.tokenSet = tokenSet;

      return tokenSet.access_token;
    } catch (error) {
      console.log(error, 'authenticate');
      console.error('Failed to make OAuth Access Token payment API call');

      throw new SafaricomApiError(`Error: ${error.message}`);
    }
  }

  private createTransferPayload(
    transferData: DoTransferParams,
  ): TransferRequestSafaricomApiDto {
    return {
      InitiatorName: process.env.SAFARICOM_INITIATORNAME!,
      SecurityCredential: process.env.SAFARICOM_SECURITY_CREDENTIAL!,
      CommandID: 'BusinessPayment',
      Amount: transferData.transferAmount,
      PartyA: process.env.SAFARICOM_PARTY_A!,
      PartyB: transferData.phoneNumber, // Set to '254000000000' to trigger mock failure on callback and '254000000001' to trigger mock failure on request
      Remarks: 'No remarks', // Not used for reconciliation by clients. Required to be non-empty, so filled with default value.
      QueueTimeOutURL: safaricomTimeoutCallbackUrl,
      ResultURL: safaricomTransferCallbacktUrl,
      OriginatorConversationID: transferData.originatorConversationId,
      IDType: process.env.SAFARICOM_IDTYPE!,
      IDNumber: transferData.idNumber,
    };
  }

  private async transfer(
    payload: TransferRequestSafaricomApiDto,
  ): Promise<TransferResponseSafaricomApiDto> {
    try {
      const paymentUrl = !!process.env.MOCK_SAFARICOM
        ? `${process.env.MOCK_SERVICE_URL}api/fsp/safaricom/transfer`
        : `${process.env.SAFARICOM_API_URL}/${process.env.SAFARICOM_B2C_PAYMENTREQUEST_ENDPOINT}`;
      const headers = [
        {
          name: 'Authorization',
          value: `Bearer ${this.tokenSet?.access_token}`,
        },
      ];

      return await this.httpService.post<TransferResponseSafaricomApiDto>(
        `${paymentUrl}`,
        payload,
        headers,
      );
    } catch (error) {
      console.log(error, 'transfer');
      console.error('Failed to make Safaricom B2C payment API call');

      throw new SafaricomApiError(`Error: ${error.message}`);
    }
  }
}
