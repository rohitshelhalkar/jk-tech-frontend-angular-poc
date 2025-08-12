export const environment = {
  production: false,
  apiUrl: 'http://localhost:3007',
  apiEndpoints: {
    auth: {
      login: '/auth/login',
      register: '/auth/register',
      profile: '/auth/me',
      logout: '/auth/logout'
    },
    users: '/users',
    documents: '/documents',
    ingestion: '/ingest'
  },
  storage: {
    tokenKey: 'jk_tech_token',
    userKey: 'jk_tech_user'
  },
  polling: {
    ingestionStatusInterval: 5000 // 5 seconds
  }
};
