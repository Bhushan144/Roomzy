import { apiSlice } from '../apiSlice';

export const profileApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createFlatmateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/identity/profile',
        method: 'POST',
        body: profileData,
      }),
      // Invalidate the Profile tag so any cached profile data is refreshed
      invalidatesTags: ['Profile'], 
    }),
    getFlatmateProfile: builder.query({
      query: () => '/identity/profile',
      providesTags: ['Profile'],
    }),
    uploadProfilePicture: builder.mutation({
      query: (formData) => ({
        url: '/identity/profile/picture',
        method: 'POST',
        body: formData, // Sending FormData directly for file upload
      }),
      invalidatesTags: ['Profile'],
    }),
  }),
});

export const { useCreateFlatmateProfileMutation, useGetFlatmateProfileQuery, useUploadProfilePictureMutation } = profileApi;