export const environment = {
  production: true,
  // apiUrl: 'https://api.jktech.com', // Replace with your production API URL
  apiUrl: 'http://localhost:3007', // Replace with your production API URL
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
    ingestionStatusInterval: 10000 // 10 seconds in production
  }
};