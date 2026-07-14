import { apiSlice } from '../apiSlice';

export const matchingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMatchScore: builder.query({
      query: ({ targetId, targetType }) => ({
        url: `/matching/score/${targetId}?targetType=${targetType}`,
        method: 'GET',
      }),
    }),
  }),
});

export const { useGetMatchScoreQuery } = matchingApi;