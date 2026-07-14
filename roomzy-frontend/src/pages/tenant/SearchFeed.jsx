import { useState } from 'react';
import RoomResults from '../../components/RoomResults';
import FlatmateResults from '../../components/FlatmateResults';
import MatchModal from '../../components/MatchModal';

export default function SearchFeed() {
  const [activeTab, setActiveTab] = useState('rooms');
  
  // Modal State Management
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    targetId: null,
    targetType: null
  });

  const openMatchModal = (targetId, targetType) => {
    setModalConfig({ isOpen: true, targetId, targetType });
  };

  const closeMatchModal = () => {
    setModalConfig({ isOpen: false, targetId: null, targetType: null });
  };

  return (
    <div className="max-w-7xl mx-auto mt-4 px-4 pb-12 relative">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Discovery Engine</h1>
        <p className="text-gray-500 mt-1">Find your next home or your next roommate.</p>
      </div>

      <div className="flex space-x-1 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'rooms' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Find a Room
        </button>
        <button
          onClick={() => setActiveTab('flatmates')}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'flatmates' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Find Flatmates
        </button>
      </div>

      {/* Pass the open function down to the result components */}
      {activeTab === 'rooms' ? (
        <RoomResults onEvaluate={(id) => openMatchModal(id, 'ROOM')} />
      ) : (
        <FlatmateResults onEvaluate={(id) => openMatchModal(id, 'FLATMATE')} />
      )}

      {/* The Global Match Modal */}
      <MatchModal 
        isOpen={modalConfig.isOpen}
        targetId={modalConfig.targetId}
        targetType={modalConfig.targetType}
        onClose={closeMatchModal}
      />
    </div>
  );
}