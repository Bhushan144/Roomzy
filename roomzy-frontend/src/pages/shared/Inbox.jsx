import { useState } from 'react';
import { useGetInboxQuery, useRespondToRequestMutation } from '../../store/api/interactionApi';
import { Link } from 'react-router-dom';

export default function Inbox() {
  const [activeTab, setActiveTab] = useState('incoming');

  const { data: response, isLoading } = useGetInboxQuery(activeTab);
  const [respond] = useRespondToRequestMutation();

  const interactions = response?.data || [];

  const handleResponse = async (interactionId, status) => {
    try {
      await respond({ interactionId, status }).unwrap();
    } catch (err) {
      console.error('Failed to respond', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4 mb-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Inbox</h1>

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'incoming' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          Incoming Requests
        </button>
        <button
          onClick={() => setActiveTab('outgoing')}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'outgoing' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
        >
          Sent Requests
        </button>
      </div>

      {/* List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading your messages...</div>
        ) : interactions.length === 0 ? (
          <div className="p-16 text-center text-gray-500">
            You have no {activeTab} requests right now.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {interactions.map((interaction) => (
              <li key={interaction._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className={`px-2 py-1 text-xs font-bold rounded mr-3 ${interaction.type === 'ROOM' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                        {interaction.type} INQUIRY
                      </span>
                      <span className="text-sm text-gray-500 font-medium">
                        {new Date(interaction.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* If incoming, show the sender's email. If outgoing, show the receiver's email */}
                    {activeTab === 'incoming' && interaction.initiatorId ? (
                      <h4 className="text-lg font-semibold text-gray-900 mt-2">
                        Request from: {interaction.initiatorId.email}
                      </h4>
                    ) : activeTab === 'outgoing' && interaction.receiverId ? (
                      <h4 className="text-lg font-semibold text-gray-900 mt-2">
                        Sent to: {interaction.receiverId.email}
                      </h4>
                    ) : null}

                    {interaction.message && (
                      <p className="mt-2 text-gray-700 bg-gray-100 p-3 rounded-md text-sm border-l-4 border-gray-300">
                        "{interaction.message}"
                      </p>
                    )}
                  </div>

                  {/* Actions for Incoming Requests */}
                  {activeTab === 'incoming' && interaction.status === 'PENDING' && (
                    <div className="ml-6 flex flex-col space-y-2 w-32">
                      <button
                        onClick={() => handleResponse(interaction._id, 'ACCEPTED')}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleResponse(interaction._id, 'DECLINED')}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {/* Status Badges for Outgoing OR Responded Incoming */}
                  {((activeTab === 'incoming' && interaction.status !== 'PENDING') || activeTab === 'outgoing') && (
                    <div className="ml-6 flex flex-col items-end w-32">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${interaction.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                          interaction.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                        {interaction.status}
                      </span>

                      {interaction.status === 'ACCEPTED' && (
                        <Link
                          to={`/chat/${interaction._id}`}
                          className="mt-3 text-sm text-accent font-medium hover:underline inline-block"
                        >
                          Open Chat &rarr;
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}