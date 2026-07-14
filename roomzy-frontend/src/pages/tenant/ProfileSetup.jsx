import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { useCreateFlatmateProfileMutation, useGetFlatmateProfileQuery, useUploadProfilePictureMutation } from '../../store/api/profileApi';

const profileSchema = z.object({
  fullName: z.string().min(2, "Name is too short").max(50, "Name is too long"),
  budget: z.object({
    min: z.coerce.number().min(0, "Must be positive"),
    max: z.coerce.number().min(1, "Must be greater than 0"),
  }).refine(data => data.min <= data.max, {
    message: "Minimum budget cannot exceed maximum",
    path: ["max"]
  }).optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  lifestyleTraits: z.object({
    cleanliness: z.enum(['STRICT', 'MODERATE', 'RELAXED']),
    schedule: z.enum(['EARLY_BIRD', 'NIGHT_OWL', 'FLEXIBLE']),
    sociability: z.enum(['INTROVERTED', 'EXTROVERTED', 'MIXED']),
    petFriendly: z.boolean(),
  }).optional()
});

export default function ProfileSetup() {
  const { user } = useSelector((state) => state.auth);
  const { data: profileResponse, isLoading: isFetching } = useGetFlatmateProfileQuery();
  const [createProfile, { isLoading: isSaving, error }] = useCreateFlatmateProfileMutation();
  const [uploadPicture, { isLoading: isUploading }] = useUploadProfilePictureMutation();
  
  const existingProfile = profileResponse?.data;
  
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('picture', file);

    try {
      await uploadPicture(formData).unwrap();
    } catch (err) {
      console.error('Failed to upload picture:', err);
      alert('Failed to upload profile picture. Please try again.');
    }
  };

  const { register, handleSubmit, trigger, reset, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      budget: { min: 500, max: 1500 },
      bio: '',
      lifestyleTraits: {
        cleanliness: 'MODERATE',
        schedule: 'FLEXIBLE',
        sociability: 'MIXED',
        petFriendly: false
      }
    }
  });

  // Load existing profile into form and determine mode
  useEffect(() => {
    if (existingProfile) {
      reset(existingProfile);
      setIsEditing(false); // Profile exists, show it!
    } else if (!isFetching) {
      setIsEditing(true); // No profile, force setup mode
    }
  }, [existingProfile, isFetching, reset]);

  const handleNextStep = async () => {
    const isStepValid = await trigger(['fullName', 'budget.min', 'budget.max', 'bio']);
    if (isStepValid) setStep(2);
  };

  const onSubmit = async (data) => {
    try {
      await createProfile(data).unwrap();
      setIsEditing(false);
      setStep(1);
    } catch (err) {
      console.error('Failed to create profile:', err);
    }
  };

  if (isFetching) return <div className="text-center mt-20 text-gray-500">Loading Profile...</div>;

  // ================= VIEW MODE =================
  if (!isEditing && existingProfile) {
    const traits = existingProfile.lifestyleTraits;
    
    return (
      <div className="max-w-3xl mx-auto mt-6">
        {/* Cover Photo Area */}
        <div className="h-48 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-t-2xl shadow-sm relative">
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-10">
            <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg group relative">
              <label className="cursor-pointer block w-full h-full rounded-full overflow-hidden relative">
                {isUploading && (
                   <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                   </div>
                )}
                {existingProfile.profilePicture ? (
                   <img src={existingProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl font-bold text-gray-400 group-hover:bg-gray-200 transition-colors">
                    {user?.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold uppercase tracking-wider">
                  Change
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/jpeg, image/png, image/webp" 
                  onChange={handleFileChange} 
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white px-8 pt-20 pb-8 rounded-b-2xl shadow-sm border border-gray-100 border-t-0 text-center relative">
          
          <button 
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Edit Profile
          </button>

          <h2 className="text-2xl font-bold text-gray-900 capitalize">
            {existingProfile.fullName || 'User'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
          <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wider">
            {user?.role === 'TENANT' ? 'Flatmate Seeker' : 'Property Owner'}
          </span>

          {/* Bio section */}
          <div className="mt-6 max-w-lg mx-auto">
            <p className="text-gray-700 italic">
              "{existingProfile.bio || 'I am looking for a great place to live!'}"
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {user?.role === 'TENANT' && existingProfile.budget && traits && (
              <>
            {/* Financials */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Financials</h3>
              <div className="flex items-center text-gray-800">
                <span className="text-3xl mr-2">💰</span>
                <div>
                  <p className="text-xs text-gray-500">Target Budget Range</p>
                  <p className="font-semibold text-lg">₹{existingProfile.budget.min} - ₹{existingProfile.budget.max} <span className="text-sm font-normal text-gray-500">/mo</span></p>
                </div>
              </div>
            </div>

            {/* Vibe Check */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">The Vibe</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm flex items-center">
                  <span className="mr-1.5">✨</span>
                  {traits.cleanliness === 'STRICT' ? 'Spotless' : traits.cleanliness === 'MODERATE' ? 'Neat & Tidy' : 'Relaxed'}
                </span>
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm flex items-center">
                  <span className="mr-1.5">🕒</span>
                  {traits.schedule === 'EARLY_BIRD' ? 'Early Bird' : traits.schedule === 'NIGHT_OWL' ? 'Night Owl' : 'Flexible Hours'}
                </span>
                <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-medium text-gray-700 shadow-sm flex items-center">
                  <span className="mr-1.5">💬</span>
                  {traits.sociability === 'INTROVERTED' ? 'Introverted' : traits.sociability === 'EXTROVERTED' ? 'Extroverted' : 'Ambivert'}
                </span>
                {traits.petFriendly && (
                  <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium shadow-sm flex items-center">
                    <span className="mr-1.5">🐾</span> Pet Friendly
                  </span>
                )}
              </div>
            </div>
            </>
          )}
          </div>
          
          <div className="mt-10">
             {user?.role === 'TENANT' ? (
               <button onClick={() => navigate('/search')} className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-md hover:bg-gray-800 transition-all hover:shadow-lg">
                  Find Rooms Matching My Profile &rarr;
               </button>
             ) : (
               <button onClick={() => navigate('/dashboard')} className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-md hover:bg-gray-800 transition-all hover:shadow-lg">
                  Manage My Properties &rarr;
               </button>
             )}
          </div>
        </div>
      </div>
    );
  }

  // ================= EDIT / SETUP MODE =================
  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">
            {existingProfile ? 'Edit Your Profile' : 'Build Your Profile'}
          </h2>
          <p className="text-gray-500">Let the AI engine know what you're looking for.</p>
        </div>
        {existingProfile && (
           <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-800">
             &times; Cancel
           </button>
        )}
      </div>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 p-3 rounded">
          {error.data?.message || 'Failed to save profile. Please try again.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* STEP 1: Logistics */}
        <div className={step === 1 ? 'block animate-fade-in' : 'hidden'}>
          <h3 className="text-lg font-bold mb-5 flex items-center">
            <span className="bg-gray-100 text-gray-800 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">1</span> 
            The Logistics
          </h3>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" {...register('fullName')} placeholder="e.g. John Doe" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-colors" />
            {errors.fullName && <span className="text-red-500 text-xs mt-1 block">{errors.fullName.message}</span>}
          </div>
          
          {user?.role === 'TENANT' && (
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget (₹)</label>
                <input type="number" {...register('budget.min')} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-colors" />
                {errors.budget?.min && <span className="text-red-500 text-xs mt-1 block">{errors.budget.min.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (₹)</label>
                <input type="number" {...register('budget.max')} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-colors" />
                {errors.budget?.max && <span className="text-red-500 text-xs mt-1 block">{errors.budget.max.message}</span>}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio (Optional)</label>
            <textarea {...register('bio')} rows="3" placeholder="I'm a computer engineering student who loves coding..." className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-colors"></textarea>
            {errors.bio && <span className="text-red-500 text-xs mt-1 block">{errors.bio.message}</span>}
          </div>

          <div className="mt-8 flex justify-end">
            {user?.role === 'TENANT' ? (
              <button type="button" onClick={handleNextStep} className="px-6 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-black transition-colors shadow-sm flex items-center">
                Next: Lifestyle <span className="ml-2">&rarr;</span>
              </button>
            ) : (
              <button type="submit" disabled={isSaving} className="px-8 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm">
                {isSaving ? 'Saving...' : existingProfile ? 'Update Profile' : 'Save Profile'}
              </button>
            )}
          </div>
        </div>

        {/* STEP 2: Lifestyle */}
        <div className={step === 2 ? 'block animate-fade-in' : 'hidden'}>
          <h3 className="text-lg font-bold mb-5 flex items-center">
            <span className="bg-gray-100 text-gray-800 w-6 h-6 rounded-full inline-flex items-center justify-center text-sm mr-2">2</span> 
            Your Lifestyle
          </h3>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cleanliness Standard</label>
              <select {...register('lifestyleTraits.cleanliness')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-colors appearance-none">
                <option value="RELAXED">Relaxed (A little clutter is fine)</option>
                <option value="MODERATE">Moderate (Clean common areas)</option>
                <option value="STRICT">Strict (Spotless at all times)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Daily Schedule</label>
              <select {...register('lifestyleTraits.schedule')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-colors appearance-none">
                <option value="EARLY_BIRD">Early Bird (Asleep by 10 PM)</option>
                <option value="FLEXIBLE">Flexible (Standard 9-to-5ish)</option>
                <option value="NIGHT_OWL">Night Owl (Up late, sleep in)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sociability</label>
              <select {...register('lifestyleTraits.sociability')} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-colors appearance-none">
                <option value="INTROVERTED">Introverted (Keep to myself mostly)</option>
                <option value="MIXED">Mixed (Friendly, but respect closed doors)</option>
                <option value="EXTROVERTED">Extroverted (Love hosting and hanging out)</option>
              </select>
            </div>

            <div className="flex items-start mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center h-5 mt-0.5">
                <input type="checkbox" {...register('lifestyleTraits.petFriendly')} id="petFriendly" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="petFriendly" className="font-medium text-gray-700 cursor-pointer">Pet Friendly</label>
                <p className="text-gray-500">Check this if you own a pet or don't mind living with one.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button type="button" onClick={() => setStep(1)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors">
              &larr; Back
            </button>
            <button type="submit" disabled={isSaving} className="px-8 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm">
              {isSaving ? 'Saving...' : existingProfile ? 'Update Profile' : 'Complete Profile'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}