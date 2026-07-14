import { apiSlice } from '../apiSlice';

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all listings owned by the logged-in user
    getMyListings: builder.query({
      query: () => '/inventory/listings/me', // Assumes a standard /me route on backend
      providesTags: ['Listing'],
    }),
    
    // Create a new listing
    createListing: builder.mutation({
      query: (listingData) => ({
        url: '/inventory/listings',
        method: 'POST',
        body: listingData,
      }),
      
      // Invalidate the cache to force the dashboard to refetch
      invalidatesTags: ['Listing'], 
    }),

    uploadPhotos: builder.mutation({
      query: ({ listingId, formData }) => ({
        url: `/inventory/listings/${listingId}/photos`,
        method: 'POST',
        // By passing a FormData object directly, RTK Query automatically 
        // sets the correct multipart/form-data headers and boundaries.
        body: formData, 
      }),
      invalidatesTags: ['Listing'],
    }),

    deleteListing: builder.mutation({
      query: (listingId) => ({
        url: `/inventory/listings/${listingId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Listing'],
    }),

  }),
});

export const { useGetMyListingsQuery, useCreateListingMutation, useUploadPhotosMutation, useDeleteListingMutation } = inventoryApi;