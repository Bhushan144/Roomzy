import { apiSlice } from '../apiSlice';

export const messagingApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getChatHistory: builder.query({
      query: (interactionId) => `/messaging/history/${interactionId}`,
      // We don't provide tags here because new messages are handled via Sockets, 
      // not by invalidating and refetching the whole REST API cache.
    }),
  }),
});

export const { useGetChatHistoryQuery } = messagingApi;