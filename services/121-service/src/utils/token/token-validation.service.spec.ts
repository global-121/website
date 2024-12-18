import { Test, TestingModule } from '@nestjs/testing';
import { TokenSet } from 'openid-client';

import { TokenValidationService as TokenValidationService } from '@121-service/src/utils/token/token-validation.service';

describe('TokenValidationService', () => {
  let tokenValidationService: TokenValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenValidationService],
    }).compile();

    tokenValidationService = module.get<TokenValidationService>(
      TokenValidationService,
    );
  });

  describe('isTokenValid', () => {
    // ##TODO: Check if valuable to add more tests based on edge case inputs (e.g. expires_at=0 or negative, etc.)

    it('should return false if tokenSet is not filled', () => {
      const tokenSet = new TokenSet();

      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if tokenSet does not have expires_at', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
      });

      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if token is expired', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() - 1 * 60 * 1000,
      }); // Expired 1 minute ago
      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return false if token expires in less than 5 minutes', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() + 4 * 60 * 1000,
      }); // Expires in 4 minutes
      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(false);
    });

    it('should return true if token is valid and expires in more than 5 minutes', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: Date.now() + 10 * 60 * 1000,
      }); // Expires in 10 minutes
      expect(tokenValidationService.isTokenValid(tokenSet)).toBe(true);
    });

    it('should correctly multiply if expires_at is passed in seconds and that is correctly signaled', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: (Date.now() + 10 * 60 * 1000) / 1000,
      }); // Expired 1 minute ago
      const expiresAtInSeconds = true;
      expect(
        tokenValidationService.isTokenValid(tokenSet, expiresAtInSeconds),
      ).toBe(true);
    });

    it('should fail if expires_at is passed in seconds, without signaling that', () => {
      const tokenSet = new TokenSet({
        access_token: 'some-token',
        expires_at: (Date.now() + 10 * 60 * 1000) / 1000,
      }); // Expired 1 minute ago
      const expiresAtInSeconds = false;
      expect(
        tokenValidationService.isTokenValid(tokenSet, expiresAtInSeconds),
      ).toBe(false);
    });
  });
});
