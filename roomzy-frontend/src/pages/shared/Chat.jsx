import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetChatHistoryQuery } from '../../store/api/messagingApi';
import { useSocket } from '../../context/SocketContext';

export default function Chat() {
  const { interactionId } = useParams();
  const { user } = useSelector((state) => state.auth);
  const socket = useSocket();
  const messagesEndRef = useRef(null);
  
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [otherUserProfile, setOtherUserProfile] = useState(null);

  // 1. Fetch historical messages
  const { data: historyResponse, isLoading } = useGetChatHistoryQuery(interactionId, { refetchOnMountOrArgChange: true });

  // 2. Initialize state with historical data
  useEffect(() => {
    if (historyResponse?.data) {
      // Backend returns newest first (for pagination). We need oldest first for UI flow.
      const reversedHistory = [...historyResponse.data.messages].reverse();
      setMessages(reversedHistory);

      const interaction = historyResponse.data.interaction;
      if (interaction && user) {
        const other = interaction.initiatorId._id === user.id 
          ? interaction.receiverId 
          : interaction.initiatorId;
        setOtherUser(other);
        setOtherUserProfile(interaction.otherUserProfile);
      }
    }
  }, [historyResponse, user]);

  // 3. Listen for real-time socket events
  useEffect(() => {
    if (!socket || !interactionId) return;

    // Ensure we are in the room (in case the interaction was accepted after our socket connected)
    socket.emit('join_room', interactionId);

    const handleNewMessage = (newMessage) => {
      // Only append if the message belongs to this specific chat room
      if (newMessage.interactionId === interactionId) {
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, interactionId]);

  // 4. Auto-scroll to the bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket) return;

    // Emit the event to the backend
    socket.emit('send_message', {
      interactionId,
      content: inputMessage.trim(),
    });

    setInputMessage('');
  };

  if (isLoading) return <div className="text-center mt-20 text-gray-500">Loading chat...</div>;

  return (
    <div className="max-w-3xl mx-auto mt-4 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[75vh]">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center bg-gray-50 rounded-t-lg">
        <Link to="/inbox" className="text-gray-500 hover:text-gray-900 mr-4 font-medium">
          &larr; Back to Inbox
        </Link>
        <div className="flex items-center">
          {otherUserProfile?.profilePicture ? (
            <img src={otherUserProfile.profilePicture} alt="Profile" className="w-10 h-10 rounded-full object-cover mr-3 shadow-sm border border-gray-100" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-lg mr-3 shadow-sm border border-gray-200">
              {(otherUserProfile?.fullName || otherUser?.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-gray-900 leading-tight capitalize">
              {otherUserProfile?.fullName || (otherUser ? otherUser.email.split('@')[0] : 'Conversation')}
            </h2>
            {otherUser && (
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {otherUser.role}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-grow p-6 overflow-y-auto bg-white">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No messages yet. Say hello!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isMine = msg.senderId === user.id;
              
              return (
                <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                      isMine 
                        ? 'bg-primary text-white rounded-br-none' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                    <span className={`text-[10px] block mt-1 ${isMine ? 'text-gray-300' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="bg-primary text-white px-6 py-2 rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>

    </div>
  );
}