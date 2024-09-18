import { getQueueToken } from '@nestjs/bull';
import { Test, TestingModule } from '@nestjs/testing';
import { Queue } from 'bull';
import { Redis } from 'ioredis';

import { TransferParams } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-api/transfer-params.interface';
import { SafaricomTransferCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-callback.dto';
import { SafaricomTransferTimeoutCallbackDto } from '@121-service/src/payments/fsp-integration/safaricom/dtos/safaricom-transfer-timeout-callback.dto';
import { DoTransferParams } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer.interface';
import { DoTransferReturnType } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/do-transfer-return-type.interface';
import { SafaricomTransferResponseBody } from '@121-service/src/payments/fsp-integration/safaricom/interfaces/safaricom-transfer-response.interface';
import { SafaricomTransferRepository } from '@121-service/src/payments/fsp-integration/safaricom/repositories/safaricom-transfer.repository';
import { SafaricomApiService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.api.service';
import { SafaricomService } from '@121-service/src/payments/fsp-integration/safaricom/safaricom.service';
import { SafaricomApiError } from '@121-service/src/payments/fsp-integration/safaricom/safaricom-api.error';
import {
  getRedisSetName,
  REDIS_CLIENT,
} from '@121-service/src/payments/redis/redis-client';
import { FinancialServiceProviderCallbackQueuesNames } from '@121-service/src/shared/enum/financial-service-provider-callback-queue-names.enum';
import { PaymentQueueNames } from '@121-service/src/shared/enum/payment-queue-names.enum';

const mockedSafaricomTransferParams: DoTransferParams = {
  transferAmount: 100,
  phoneNumber: '254708374149',
  remarks: 'Payment 1',
  originatorConversationId: 'mocked_originator_conversation_id',
  idNumber: 'mocked_national_id',
  transactionId: 1,
};

const mockedSafaricomTransferPayloadParams: TransferParams = {
  InitiatorName: 'initiator_name',
  SecurityCredential: 'security_credential',
  CommandID: 'command_id',
  Amount: 100,
  PartyA: 'party_A',
  PartyB: '254708374149',
  Remarks: 'Payment#1',
  QueueTimeOutURL: 'https://mocked-url.com/timeout',
  ResultURL: 'https://mocked-url.com/callback',
  OriginatorConversationID: 'originator_conversation_id',
  IDType: 'mocked_id_type',
  IDNumber: 'mocked_id_number',
};

describe('SafaricomService', () => {
  let service: SafaricomService;
  let safaricomApiService: SafaricomApiService;
  let safaricomTransferRepository: SafaricomTransferRepository;

  let redisClient: Redis;
  let safaricomTransferCallbackQueue: Queue;
  let safaricomTransferTimeoutCallbackQueue: Queue;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SafaricomService,
        {
          provide: SafaricomApiService,
          useValue: {
            authenticate: jest.fn(),
            sendTransfer: jest.fn(),
            createTransferPayload: jest.fn(),
          },
        },
        {
          provide: SafaricomTransferRepository,
          useValue: {
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: REDIS_CLIENT,
          useValue: {
            sadd: jest.fn(),
          },
        },
        {
          provide: getQueueToken(
            FinancialServiceProviderCallbackQueuesNames.safaricomTransferCallback,
          ),
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: getQueueToken(
            FinancialServiceProviderCallbackQueuesNames.safaricomTransferTimeoutCallback,
          ),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SafaricomService>(SafaricomService);
    safaricomApiService = module.get<SafaricomApiService>(SafaricomApiService);
    safaricomTransferRepository = module.get<SafaricomTransferRepository>(
      SafaricomTransferRepository,
    );
    safaricomTransferCallbackQueue = module.get(
      getQueueToken(
        FinancialServiceProviderCallbackQueuesNames.safaricomTransferCallback,
      ),
    );
    safaricomTransferTimeoutCallbackQueue = module.get(
      getQueueToken(
        FinancialServiceProviderCallbackQueuesNames.safaricomTransferTimeoutCallback,
      ),
    );
    redisClient = module.get(REDIS_CLIENT);
  });

  describe('sendPayment', () => {
    it('should throw an error when called', async () => {
      await expect(service.sendPayment([], 1, 1)).rejects.toThrow(
        'Method should not be called anymore.',
      );
    });
  });

  describe('doTransfer', () => {
    it('should authenticate and send payment', async () => {
      const result: DoTransferReturnType = {
        originatorConversationId: 'mocked_originator_conversation_id',
        conversationId: 'mocked_conversation_id',
      };
      const sendTransferResult: SafaricomTransferResponseBody = {
        ConversationID: 'mocked_conversation_id',
        OriginatorConversationID: 'mocked_originator_conversation_id',
        ResponseCode: '0',
        ResponseDescription: 'Success',
      };

      jest.spyOn(safaricomTransferRepository, 'save'); //.mockResolvedValue();
      jest.spyOn(safaricomTransferRepository, 'update'); //.mockResolvedValue();
      jest
        .spyOn(safaricomApiService, 'authenticate')
        .mockResolvedValue('mocked-access-token');
      jest
        .spyOn(safaricomApiService, 'createTransferPayload')
        .mockReturnValue(mockedSafaricomTransferPayloadParams);
      jest
        .spyOn(safaricomApiService, 'sendTransfer')
        .mockResolvedValue(sendTransferResult);

      const transferResult = await service.doTransfer(
        mockedSafaricomTransferParams,
      );

      expect(safaricomTransferRepository.save).toHaveBeenCalled();
      expect(safaricomApiService.authenticate).toHaveBeenCalled();
      expect(safaricomApiService.createTransferPayload).toHaveBeenCalledWith(
        mockedSafaricomTransferParams,
      );
      expect(safaricomApiService.sendTransfer).toHaveBeenCalledWith(
        mockedSafaricomTransferPayloadParams,
      );
      expect(safaricomTransferRepository.update).toHaveBeenCalled();
      expect(transferResult).toEqual(result);
    });

    it('should handler unexpected error like 404', async () => {
      jest.spyOn(safaricomTransferRepository, 'save');
      jest.spyOn(safaricomTransferRepository, 'update');
      jest
        .spyOn(safaricomApiService, 'authenticate')
        .mockResolvedValue('mocked-access-token');
      jest
        .spyOn(safaricomApiService, 'createTransferPayload')
        .mockReturnValue(mockedSafaricomTransferPayloadParams);

      jest
        .spyOn(safaricomApiService, 'sendTransfer')
        .mockRejectedValueOnce(new SafaricomApiError('404 Not Found'));

      await expect(
        service.doTransfer(mockedSafaricomTransferParams),
      ).rejects.toThrow(new SafaricomApiError('404 Not Found'));

      expect(safaricomTransferRepository.save).toHaveBeenCalled();
      expect(safaricomApiService.authenticate).toHaveBeenCalled();
      expect(safaricomApiService.createTransferPayload).toHaveBeenCalledWith(
        mockedSafaricomTransferParams,
      );
    });
  });

  describe('processTransferCallback', () => {
    it('should add job to safaricomTransferCallbackQueue and update Redis', async () => {
      const mockCallback: SafaricomTransferCallbackDto = {
        Result: {
          OriginatorConversationID: 'originator-conversation-id',
          ConversationID: 'conversation-id',
          TransactionID: 'transaction-id',
          ResultCode: 0,
          ResultDesc: 'Success',
        },
      };

      const mockJob = {
        id: 'job-id',
        data: { programId: 3 },
      };

      jest.spyOn(redisClient, 'sadd').mockResolvedValue(1);
      jest
        .spyOn(safaricomTransferCallbackQueue, 'add')
        .mockResolvedValue(mockJob as any);

      await service.processTransferCallback(mockCallback);

      expect(safaricomTransferCallbackQueue.add).toHaveBeenCalledWith(
        PaymentQueueNames.financialServiceProviderCallback,
        {
          originatorConversationId:
            mockCallback.Result.OriginatorConversationID,
          mpesaConversationId: mockCallback.Result.ConversationID,
          mpesaTransactionId: mockCallback.Result.TransactionID,
          resultCode: mockCallback.Result.ResultCode,
          resultDescription: mockCallback.Result.ResultDesc,
        },
      );

      expect(redisClient.sadd).toHaveBeenCalledWith(
        getRedisSetName(mockJob.data.programId),
        mockJob.id,
      );
    });
  });

  describe('processTransferTimeoutCallback', () => {
    it('should add job to safaricomTransferTimeoutCallbackQueue and update Redis', async () => {
      const mockTimeoutCallback: SafaricomTransferTimeoutCallbackDto = {
        OriginatorConversationID: 'originator-conversation-id',
        InitiatorName: 'initiator-name',
        SecurityCredential: 'security-credential',
        CommandID: 'command-id',
        Amount: 0,
        PartyA: 'party-A',
        PartyB: 'party-B',
        Remarks: 'remarks',
        QueueTimeOutURL: 'http://example.org/timeout',
        ResultURL: 'http://example.org/result',
        IDType: 'id-type',
        IDNumber: 'id-number',
      };

      const mockJob = {
        id: 'job-id',
        data: { programId: 3 },
      };

      jest.spyOn(redisClient, 'sadd').mockResolvedValue(1);
      jest
        .spyOn(safaricomTransferTimeoutCallbackQueue, 'add')
        .mockResolvedValue(mockJob as any);

      await service.processTransferTimeoutCallback(mockTimeoutCallback);

      expect(safaricomTransferTimeoutCallbackQueue.add).toHaveBeenCalledWith(
        PaymentQueueNames.financialServiceProviderTimeoutCallback,
        {
          originatorConversationId:
            mockTimeoutCallback.OriginatorConversationID,
        },
      );

      expect(redisClient.sadd).toHaveBeenCalledWith(
        getRedisSetName(mockJob.data.programId),
        mockJob.id,
      );
    });
  });
});
