// Output should be a valid TS-file:
module.exports = `// THIS FILE IS GENERATED BY 'npm run set-env-variables'

export const environment = {
  production: ${process.env.NG_PRODUCTION || 'true'},

  // Feature-switches:
  useServiceWorker: ${process.env.NG_USE_SERVICE_WORKER || 'true'},

  // APIs:

  // Regions:
  regions: '${process.env.REGIONS}',

  // Third-party tokens:
  // Google Sheets API:
  google_sheets_api_url: '${process.env.GOOGLE_SHEETS_API_URL}',
  google_sheets_sheet_ids: '${process.env.GOOGLE_SHEETS_SHEET_IDS}',

  // Application Insights
  ai_ikey: '${process.env.NG_AI_IKEY}',
  ai_endpoint: '${process.env.NG_AI_ENDPOINT}',

  matomo_id: '${process.env.NG_MATOMO_ID}',
  matomo_endpoint_api: '${process.env.NG_MATOMO_ENDPOINT_API}',
  matomo_endpoint_js: '${process.env.NG_MATOMO_ENDPOINT_JS}',
};
`;
