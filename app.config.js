import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    PEXELS_API_KEY: process.env.PEXELS_API_KEY,
    PEXELS_COLLECTION_ID: process.env.PEXELS_COLLECTION_ID,
  },
});
