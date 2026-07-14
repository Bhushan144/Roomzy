import { apiSlice } from '../apiSlice';

export const searchApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    searchRooms: builder.query({
      // params will be an object like { maxBudget: 1500, roomType: 'PRIVATE_ROOM' }
      query: (params) => ({
        url: '/search/rooms',
        method: 'GET',
        params: params, 
      }),
    }),
    searchFlatmates: builder.query({
      query: (params) => ({
        url: '/search/flatmates',
        method: 'GET',
        params: params,
      }),
    }),
  }),
});

export const { useSearchRoomsQuery, useSearchFlatmatesQuery } = searchApi;