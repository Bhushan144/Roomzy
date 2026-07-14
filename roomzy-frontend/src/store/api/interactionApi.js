import { apiSlice } from '../apiSlice';

export const interactionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sendRequest: builder.mutation({
      query: (requestData) => ({
        url: '/interactions/request',
        method: 'POST',
        body: requestData, // { targetId, type, message }
      }),
      // Invalidate so if they navigate to Sent folder, it's fresh
      invalidatesTags: ['Interaction'], 
    }),
    
    respondToRequest: builder.mutation({
      query: ({ interactionId, status }) => ({
        url: `/interactions/${interactionId}/respond`,
        method: 'PATCH',
        body: { status }, // { status: 'ACCEPTED' | 'DECLINED' }
      }),
      // Invalidate to refresh the incoming list instantly
      invalidatesTags: ['Interaction'],
    }),

    getInbox: builder.query({
      query: (type = 'incoming') => `/interactions/inbox?type=${type}`,
      providesTags: ['Interaction'],
    }),
  }),
});

export const { 
  useSendRequestMutation, 
  useRespondToRequestMutation, 
  useGetInboxQuery 
} = interactionApi;