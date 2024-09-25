import http from 'k6/http';

import config from './config.js';
const { baseUrl } = config;

export default class ResetModel {
  constructor() {}
  resetDBMockRegistrations(powerNumberRegistrations, timeout = '180s') {
    const url = `${baseUrl}api/scripts/reset?mockPowerNumberRegistrations=${powerNumberRegistrations}&mockPv=true&mockOcw=true&isApiTests=false&script=nlrc-multiple-mock-data`;
    const payload = JSON.stringify({
      secret: 'fill_in_secret',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    };
    const res = http.post(url, payload, params);
    return res;
  }

  resetDB(resetScript) {
    const url = `${baseUrl}api/scripts/reset?isApiTests=false&script=${resetScript}`;
    const payload = JSON.stringify({
      secret: 'fill_in_secret',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = http.post(url, payload, params);
    console.log('res: ', res);
    return res;
  }

  duplicateRegistrations(powerNumberRegistration) {
    const url = `${baseUrl}api/scripts/duplicate-registrations?mockPowerNumberRegistrations=${powerNumberRegistration}`;
    const payload = JSON.stringify({
      secret: 'fill_in_secret',
    });
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const res = http.post(url, payload, params);
    return res;
  }
}
