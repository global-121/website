#!/usr/bin/env node

/**
 * See the "Deployment"-section of the interfaces/README.md-file for more information.
 */

const fs = require('fs');
const dotenv = require('dotenv');

// Load environment-variables from .env file
dotenv.config({
  debug: process.env.DEBUG,
});

// Set up specifics
const sourcePath = './staticwebapp.config.base.json';
const targetPath = './staticwebapp.config.json';

let config = require(sourcePath);

// Check source/base
if (!fs.existsSync(sourcePath) || !config) {
  console.error(`Source-file not found or readable: ${sourcePath}`);
  process.exit(1);
}

if (!config.globalHeaders) {
  config.globalHeaders = {};
}

// NOTE: All values in each array are written as template-strings, as the use of single-quotes around some values (i.e. 'self') is mandatory and will affect the working of the HTTP-Header.
let contentSecurityPolicy = new Map([
  ['default-src', [`'self'`]],
  ['disown-opener', []],
  ['connect-src', [`'self'`]],
  ['frame-ancestors', [`'self'`]],
  ['frame-src', [`blob:`, `'self'`]],
  ['img-src', [`data:`, `'self'`]],
  ['object-src', [`'none'`]],
  ['referrer', [`no-referrer`]],
  ['reflected-xss', [`block`]],
  ['style-src', [`'self'`, `'unsafe-inline'`]],
  ['upgrade-insecure-requests', []],
]);

// Set API-origin
if (process.env.NG_URL_121_SERVICE_API) {
  console.info('✅ Set API-origin of the 121-service');

  const apiUrl = new URL(process.env.NG_URL_121_SERVICE_API);

  let connectSrc = contentSecurityPolicy.get('connect-src');
  contentSecurityPolicy.set('connect-src', [...connectSrc, apiUrl.origin]);
}

// Feature: Application-Insights logging
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  console.info('✅ Allow logging to Application Insights');

  let connectSrc = contentSecurityPolicy.get('connect-src');
  contentSecurityPolicy.set('connect-src', [
    ...connectSrc,
    'https://*.in.applicationinsights.azure.com',
    'https://westeurope.livediagnostics.monitor.azure.com',
  ]);
}

// Feature: Azure Entra SSO
if (process.env.USE_SSO_AZURE_ENTRA === 'true') {
  console.info('✅ Allow use of Azure Entra endpoints and iframe(s)');

  let connectSrc = contentSecurityPolicy.get('connect-src');
  contentSecurityPolicy.set('connect-src', [
    ...connectSrc,
    `https://login.microsoftonline.com`,
  ]);

  let frameSrc = contentSecurityPolicy.get('frame-src');
  contentSecurityPolicy.set('frame-src', [
    ...frameSrc,
    `https://login.microsoftonline.com`,
  ]);
}

// Feature: Twilio Flex
if (process.env.USE_IN_TWILIO_FLEX_IFRAME === 'true') {
  console.info('✅ Allow loading the Portal in an iframe on Twilio Flex');

  let frameAncestors = contentSecurityPolicy.get('frame-ancestors');
  contentSecurityPolicy.set('frame-ancestors', [
    ...frameAncestors,
    `https://flex.twilio.com`,
  ]);
}

// Feature: PowerBI Dashboard(s)
if (process.env.USE_POWERBI_DASHBOARDS === 'true') {
  console.info('✅ Allow loading Power BI-dashboards');

  let frameSrc = contentSecurityPolicy.get('frame-src');
  contentSecurityPolicy.set('frame-src', [
    ...frameSrc,
    `https://app.powerbi.com`,
  ]);
}

// Feature: Google Fonts (TODO: To Be Removed before launch! AB#31610)
if (process.env.USE_GOOGLE_FONTS === 'for-now') {
  console.info('✅ Allow loading Google Fonts');

  let styleSrc = contentSecurityPolicy.get('style-src');
  contentSecurityPolicy.set('style-src', [
    ...styleSrc,
    `https://fonts.googleapis.com`,
  ]);

  contentSecurityPolicy.set('font-src', [
    `'self'`,
    `https://fonts.gstatic.com`,
  ]);
}

// Construct the Content-Security-Policy header-value
const contentSecurityPolicyValue = Array.from(contentSecurityPolicy)
  .map((directive) => {
    const directiveKey = directive[0];
    const values = directive[1];
    return `${directiveKey} ${values.join(' ')}`;
  })
  .join(' ; ');

// Set the Content-Security-Policy header-value
if (process.env.DEBUG) {
  console.log(`Content-Security-Policy: "${contentSecurityPolicyValue}"`);
}
config.globalHeaders['Content-Security-Policy'] = contentSecurityPolicyValue;

// Write result
fs.writeFileSync(targetPath, JSON.stringify(config, null, 2));
console.info(`✅ Deployment configuration written at: ${targetPath}`);
console.log(JSON.stringify(config, null, 2));
