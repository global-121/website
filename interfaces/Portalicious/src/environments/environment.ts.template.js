// Output should be a valid TS-file:
module.exports = `// THIS FILE IS GENERATED BY 'npm run set-env-variables'

export const environment = {
  production: ${process.env.NG_PRODUCTION || 'true'},

  // Configuration/Feature-switches:
  defaultLocale: 'en',
  locales: '${process.env.NG_LOCALES || 'en,ar,fr,nl,es'}',
  envName: '${process.env.NG_ENV_NAME || ''}',

  // APIs:
  url_121_service_api: '${process.env.NG_URL_121_SERVICE_API || ''}',

  // Monitoring/Telemetry:
  applicationinsights_connection_string: '${process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || ''}',

  // Azure AD
  use_sso_azure_entra: ${process.env.USE_SSO_AZURE_ENTRA || 'false'},
  azure_ad_client_id: '${process.env.AZURE_ENTRA_CLIENT_ID || ''}',
  azure_ad_tenant_id: '${process.env.AZURE_ENTRA_TENANT_ID || ''}',
};
`;
