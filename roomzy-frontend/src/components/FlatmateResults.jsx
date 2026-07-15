import { useState, useMemo } from 'react';
import { useSearchFlatmatesQuery } from '../store/api/searchApi';
import TenantProfileModal from './TenantProfileModal';

export default function FlatmateResults({ onEvaluate }) {
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [filters, setFilters] = useState({
        minBudget: '',
        maxBudget: '',
        petFriendly: '',
    });

    const queryParams = useMemo(() => {
        const params = {};
        if (filters.minBudget !== '' && !isNaN(Number(filters.minBudget)) && Number(filters.minBudget) >= 0) {
            params.minBudget = filters.minBudget;
        }
        if (filters.maxBudget !== '' && !isNaN(Number(filters.maxBudget)) && Number(filters.maxBudget) > 0) {
            params.maxBudget = filters.maxBudget;
        }
        if (filters.petFriendly !== '') params.petFriendly = filters.petFriendly;
        return params;
    }, [filters]);

    // Frontend validation: skip query if min > max
    const hasBudgetConflict = 
        filters.minBudget !== '' && filters.maxBudget !== '' && 
        Number(filters.minBudget) > 0 && Number(filters.maxBudget) > 0 &&
        Number(filters.minBudget) > Number(filters.maxBudget);

    const { data: response, isLoading, isError, isFetching } = useSearchFlatmatesQuery(queryParams, {
        skip: hasBudgetConflict,
    });

    const flatmates = response?.data?.candidates || [];

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Budget (₹)</label>
                        <input
                            type="number"
                            name="minBudget"
                            value={filters.minBudget}
                            onChange={handleFilterChange}
                            placeholder="e.g. 10000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                        />
                    </div>

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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pet Friendly</label>
                        <select
                            name="petFriendly"
                            value={filters.petFriendly}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                        >
                            <option value="">Any</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                        </select>
                    </div>
                </div>

                {hasBudgetConflict && (
                    <div className="mt-3 text-xs text-red-500 font-medium">
                        Min budget cannot exceed max budget.
                    </div>
                )}

                {isFetching && (
                    <div className="mt-3 text-xs text-gray-400 flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-2"></div>
                        Updating...
                    </div>
                )}
            </div>

            {/* Results Grid */}
            <div className="flex-grow">
                {hasBudgetConflict ? (
                    <div className="flex justify-center items-center h-64 text-yellow-600 bg-yellow-50 rounded-lg border border-dashed border-yellow-200">
                        Adjust your budget range — min must be less than max.
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center items-center h-64 text-gray-500">Finding potential flatmates...</div>
                ) : isError ? (
                    <div className="flex justify-center items-center h-64 text-red-500">Failed to load flatmates.</div>
                ) : flatmates.length === 0 ? (
                    <div className="flex justify-center items-center h-64 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        No flatmates match your filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {flatmates.map(profile => (
                            <div 
                              key={profile._id} 
                              onClick={() => setSelectedTenant(profile)}
                              className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                            >
                                <div className="flex items-center space-x-4 mb-4">
                                    <div className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-xl overflow-hidden shrink-0">
                                        {profile.profilePicture ? (
                                            <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            (profile.fullName || profile.userId?.email)?.charAt(0).toUpperCase() || 'U'
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <h4 className="font-semibold text-gray-900 truncate">
                                            {profile.fullName || profile.userId?.email?.split('@')[0]}
                                        </h4>
                                        <p className="text-xs text-gray-500">
                                          Budget: {profile.budget ? `₹${profile.budget.min} - ₹${profile.budget.max}` : 'Not specified'}
                                        </p>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-4 flex-grow italic line-clamp-3">
                                    "{profile.bio || 'Looking for a great place to live!'}"
                                </p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">
                                        {profile.lifestyleTraits.cleanliness.replace('_', ' ')}
                                    </span>
                                    <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-100">
                                        {profile.lifestyleTraits.schedule.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="mt-auto pt-4 border-t border-gray-100 text-center">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEvaluate(profile.userId._id);
                                        }}
                                        className="text-accent font-medium text-sm hover:underline focus:outline-none w-full py-2"
                                    >
                                        Check Compatibility &rarr;
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <TenantProfileModal 
                isOpen={!!selectedTenant} 
                onClose={() => setSelectedTenant(null)} 
                tenant={selectedTenant}
                onEvaluate={onEvaluate}
            />
        </div>
    );
}