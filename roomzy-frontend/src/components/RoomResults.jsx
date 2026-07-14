import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearchRoomsQuery } from '../store/api/searchApi';

import ImageCarousel from './ImageCarousel';

export default function RoomResults({ onEvaluate }) {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        maxBudget: '',
        roomType: '',
        availableDate: '',
    });

    // Only send non-empty filters to the backend
    const queryParams = useMemo(() => {
        const params = {};
        if (filters.maxBudget !== '' && Number(filters.maxBudget) > 0) params.maxBudget = filters.maxBudget;
        if (filters.roomType !== '') params.roomType = filters.roomType;
        if (filters.availableDate !== '') {
            // Backend expects ISO datetime string
            params.availableDate = new Date(filters.availableDate).toISOString();
        }
        return params;
    }, [filters]);

    const { data: response, isLoading, isError, isFetching } = useSearchRoomsQuery(queryParams);

    const rooms = response?.data?.candidates || [];

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className="w-full md:w-64 flex-shrink-0 bg-white p-5 rounded-lg border border-gray-200 shadow-sm h-fit">
                <h3 className="text-lg font-semibold mb-4 border-b pb-2">Filters</h3>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Budget (₹)</label>
                        <input
                            type="number"
                            name="maxBudget"
                            value={filters.maxBudget}
                            onChange={handleFilterChange}
                            placeholder="e.g. 50000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                        <select
                            name="roomType"
                            value={filters.roomType}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                        >
                            <option value="">Any Type</option>
                            <option value="PRIVATE_ROOM">Private Room</option>
                            <option value="SHARED_ROOM">Shared Room</option>
                            <option value="ENTIRE_PROPERTY">Entire Property</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Available By</label>
                        <input
                            type="date"
                            name="availableDate"
                            value={filters.availableDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>
                </div>

                {isFetching && (
                    <div className="mt-3 text-xs text-gray-400 flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-2"></div>
                        Updating...
                    </div>
                )}
            </div>

            {/* Results Grid */}
            <div className="flex-grow">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64 text-gray-500">Loading rooms...</div>
                ) : isError ? (
                    <div className="flex justify-center items-center h-64 text-red-500">Failed to load rooms.</div>
                ) : rooms.length === 0 ? (
                    <div className="flex justify-center items-center h-64 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        No rooms match your filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {rooms.map(room => (
                            <div key={room._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                                <div className="h-48 bg-gray-200 relative group">
                                    <ImageCarousel photos={room.photos} altText={room.title} />
                                    <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-md text-sm font-bold text-gray-900 shadow z-10">
                                        ₹{room.rent}/mo
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 truncate">{room.title}</h3>
                                    <p className="text-sm text-gray-500 mt-1 mb-2">{room.location?.neighborhood}, {room.location?.city}</p>
                                    
                                    {/* Owner Details */}
                                    {room.ownerProfile && (
                                        <div className="flex items-center mt-3">
                                            {room.ownerProfile.profilePicture ? (
                                                <img src={room.ownerProfile.profilePicture} alt="Owner" className="w-8 h-8 rounded-full object-cover mr-2" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs mr-2 border border-gray-200">
                                                    {room.ownerProfile.fullName?.charAt(0) || 'O'}
                                                </div>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mb-0.5">Listed By</span>
                                                <span className="text-sm font-medium text-gray-900 leading-none">{room.ownerProfile.fullName || 'Property Owner'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="px-4 pb-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm bg-gray-50/50">
                                    <span className="capitalize text-gray-600 font-medium">{room.roomType.replace('_', ' ').toLowerCase()}</span>
                                    {room.interaction?.status === 'ACCEPTED' ? (
                                        <button
                                            onClick={() => navigate(`/chat/${room.interaction._id}`)}
                                            className="text-white bg-primary px-4 py-1.5 rounded-full font-medium shadow hover:bg-gray-800 transition-colors focus:outline-none flex items-center"
                                        >
                                            <span className="mr-1.5">💬</span> Chat
                                        </button>
                                    ) : room.interaction?.status === 'PENDING' ? (
                                        <span className="text-gray-400 font-medium italic">
                                            Request Sent
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => onEvaluate(room._id)}
                                            className="text-primary font-bold hover:underline focus:outline-none"
                                        >
                                            Evaluate Match &rarr;
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}