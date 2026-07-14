import { apiSlice } from '../apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/identity/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/identity/register',
        method: 'POST',
        body: userData,
      }),
    }),
    verifyOtp: builder.mutation({
      query: (otpData) => ({
        url: '/identity/verify-otp',
        method: 'POST',
        body: otpData,
      }),
    }),
  }),
});

// RTK Query automatically generates React hooks for each endpoint!
export const { 
  useLoginMutation, 
  useRegisterMutation, 
  useVerifyOtpMutation 
} = authApi;