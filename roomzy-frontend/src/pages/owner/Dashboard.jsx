import { Link } from 'react-router-dom';
import { useGetMyListingsQuery, useDeleteListingMutation } from '../../store/api/inventoryApi';
import ImageCarousel from '../../components/ImageCarousel';

export default function Dashboard() {
    const { data: response, isLoading, isError } = useGetMyListingsQuery();
    const [deleteListing] = useDeleteListingMutation();
    const listings = response?.data || [];

    if (isLoading) return <div className="mt-10 text-center text-gray-500">Loading your properties...</div>;
    if (isError) return <div className="mt-10 text-center text-red-500">Failed to load properties.</div>;

    return (
        <div className="max-w-7xl mx-auto mt-8 px-4">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Owner Dashboard</h1>
                    <p className="text-gray-500 mt-1">Manage your property listings and requests.</p>
                </div>
                <Link
                    to="/dashboard/create-listing"
                    className="px-4 py-2 bg-primary text-white font-medium rounded-md hover:bg-gray-800 transition-colors"
                >
                    + Create New Listing
                </Link>
            </div>

            {listings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200 border-dashed">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-gray-500 mb-6">Get started by creating your first property listing.</p>
                    <Link to="/dashboard/create-listing" className="text-accent hover:underline font-medium">
                        Create a Listing &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {listings.map((listing) => (
                        <div key={listing._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">

                            {/* REAL Image Rendering */}
                            <div className="h-48 bg-gray-100 flex items-center justify-center text-gray-400 relative">
                                <ImageCarousel photos={listing.photos} altText={listing.title} />
                            </div>

                            <div className="p-5 flex-grow flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-xl font-semibold text-gray-900 truncate">{listing.title}</h3>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${listing.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {listing.status}
                                    </span>
                                </div>
                                <p className="text-gray-600 mb-4 truncate">{listing.location.neighborhood}, {listing.location.city}</p>

                                <div className="mt-auto">
                                    <div className="flex justify-between items-end mb-4">
                                        <p className="text-2xl font-bold text-gray-900">₹{listing.rent}<span className="text-sm font-normal text-gray-500">/mo</span></p>
                                        <span className="text-sm text-gray-500 capitalize">{listing.roomType.replace('_', ' ')}</span>
                                    </div>

                                    {/* Navigation to Manage Photos */}
                                    <div className="flex gap-2">
                                        <Link
                                            to={`/dashboard/listings/${listing._id}/photos`}
                                            className="flex-1 text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Photos ({listing.photos?.length || 0})
                                        </Link>
                                        <button
                                            onClick={async () => {
                                                if (window.confirm('Are you sure you want to delete this listing?')) {
                                                    try {
                                                        await deleteListing(listing._id).unwrap();
                                                    } catch (err) {
                                                        alert('Failed to delete listing.');
                                                    }
                                                }
                                            }}
                                            className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}