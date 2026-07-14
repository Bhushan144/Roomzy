import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateListingMutation } from '../../store/api/inventoryApi';

const listingSchema = z.object({
  title: z.string().min(5, "Title is too short").max(100, "Title is too long"),
  description: z.string().min(20, "Please provide a detailed description"),
  rent: z.coerce.number().positive("Rent must be a positive number"),
  roomType: z.enum(['ENTIRE_PROPERTY', 'PRIVATE_ROOM', 'SHARED_ROOM']),
  availableFrom: z.string().min(1, "Available date is required"),
  location: z.object({
    city: z.string().min(2, "City is required"),
    neighborhood: z.string().min(2, "Neighborhood is required"),
  })
});

export default function CreateListing() {
  const navigate = useNavigate();
  const [createListing, { isLoading, error }] = useCreateListingMutation();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      roomType: 'PRIVATE_ROOM'
    }
  });

  const onSubmit = async (data) => {
    try {
      // Transform the form data to match the backend Zod schema exactly
      const payload = {
        title: data.title,
        description: data.description,
        rent: data.rent,
        roomType: data.roomType,
        availableFrom: new Date(data.availableFrom).toISOString(),
        location: {
          city: data.location.city,
          neighborhood: data.location.neighborhood,
          coordinates: {
            type: 'Point',
            coordinates: [-73.935242, 40.730610] // Mock Long/Lat — use geocoding API in production
          }
        }
      };
      
      await createListing(payload).unwrap();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to create listing:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 mb-16 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b pb-4">List a New Property</h2>

      {error && (
        <div className="mb-6 text-sm text-red-600 bg-red-50 p-3 rounded">
          {error.data?.message || 'Failed to create listing. Please check your inputs.'}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Basic Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Catchy Title</label>
              <input type="text" {...register('title')} placeholder="e.g. Sunny Private Room in Downtown" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
              {errors.title && <span className="text-red-500 text-xs">{errors.title.message}</span>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea {...register('description')} rows="4" placeholder="Describe the space, amenities, and vibe..." className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"></textarea>
              {errors.description && <span className="text-red-500 text-xs">{errors.description.message}</span>}
            </div>
          </div>
        </div>

        {/* Financials & Logistics */}
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-3">Logistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Rent (₹)</label>
              <input type="number" {...register('rent')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
              {errors.rent && <span className="text-red-500 text-xs">{errors.rent.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Room Type</label>
              <select {...register('roomType')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary">
                <option value="PRIVATE_ROOM">Private Room</option>
                <option value="SHARED_ROOM">Shared Room</option>
                <option value="ENTIRE_PROPERTY">Entire Property</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Available From</label>
              <input type="date" {...register('availableFrom')} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
              {errors.availableFrom && <span className="text-red-500 text-xs">{errors.availableFrom.message}</span>}
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-3">Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input type="text" {...register('location.city')} placeholder="e.g. New York" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
              {errors.location?.city && <span className="text-red-500 text-xs">{errors.location.city.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Neighborhood</label>
              <input type="text" {...register('location.neighborhood')} placeholder="e.g. East Village" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary" />
              {errors.location?.neighborhood && <span className="text-red-500 text-xs">{errors.location.neighborhood.message}</span>}
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-end space-x-4 border-t">
          <button type="button" onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="px-6 py-2 bg-primary text-white rounded-md hover:bg-gray-800 disabled:opacity-50">
            {isLoading ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>

      </form>
    </div>
  );
}