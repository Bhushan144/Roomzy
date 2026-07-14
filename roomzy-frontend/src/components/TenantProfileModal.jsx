import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function TenantProfileModal({ isOpen, onClose, tenant, onEvaluate }) {
  if (!tenant) return null;

  const traits = tenant.lifestyleTraits;
  const email = tenant.userId?.email;
  const name = tenant.fullName || (email ? email.split('@')[0] : 'User');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                
                {/* Header Actions */}
                <div className="absolute top-4 right-4 z-10">
                  <button
                    onClick={onClose}
                    className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Cover Photo Area */}
                <div className="h-40 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 relative">
                  <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 z-10">
                    <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg">
                      {tenant.profilePicture ? (
                        <img src={tenant.profilePicture} alt={name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-4xl font-bold text-gray-400">
                          {name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Content */}
                <div className="px-8 pt-20 pb-8 text-center bg-white relative">
                  
                  <Dialog.Title as="h3" className="text-2xl font-bold text-gray-900 capitalize">
                    {tenant.fullName || 'User'}
                  </Dialog.Title>
                  <p className="text-gray-500 text-sm mt-1">{email}</p>
                  <span className="inline-block mt-3 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Tenant Profile
                  </span>

                  {/* Bio section */}
                  <div className="mt-6 max-w-lg mx-auto">
                    <p className="text-gray-700 italic">
                      "{tenant.bio || 'I am looking for a great place to live!'}"
                    </p>
                  </div>

                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {/* Financials */}
                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Financials</h3>
                      <div className="flex items-center text-gray-800">
                        <span className="text-3xl mr-2">💰</span>
                        <div>
                          <p className="text-xs text-gray-500">Target Budget Range</p>
                          <p className="font-semibold text-lg">₹{tenant.budget.min} - ₹{tenant.budget.max} <span className="text-sm font-normal text-gray-500">/mo</span></p>
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
                  </div>
                  
                  {/* Action Bar */}
                  <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end space-x-4">
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onEvaluate(tenant.userId._id);
                      }}
                      className="px-8 py-2.5 bg-accent text-white rounded-full font-bold shadow-sm hover:bg-accent/90 transition-all flex items-center"
                    >
                      Check Compatibility &rarr;
                    </button>
                  </div>

                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
