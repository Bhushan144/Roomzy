import { useState, useEffect } from 'react';
import { useGetMatchScoreQuery } from '../store/api/matchingApi';
import { useSendRequestMutation } from '../store/api/interactionApi';

export default function MatchModal({ isOpen, onClose, targetId, targetType }) {
    const skipQuery = !isOpen || !targetId;
    const [pollingInterval, setPollingInterval] = useState(3000);

    const { data: response, isLoading, isError, error } = useGetMatchScoreQuery(
        { targetId, targetType },
        {
            skip: skipQuery,
            pollingInterval,
        }
    );

    useEffect(() => {
        if (response?.data?.isComplete || isError) {
            setPollingInterval(0); // Stop polling on completion OR error
        } else if (isOpen && !isError) {
            setPollingInterval(3000);
        }
    }, [response?.data?.isComplete, isOpen, isError]);

    // Extract actual error message from the API response
    const errorMessage = error?.data?.message || 'Failed to calculate score.';

    const [sendRequest, { isLoading: isSending, error: sendError }] = useSendRequestMutation();
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSendRequest = async () => {
        try {
            await sendRequest({ targetId, type: targetType, message }).unwrap();
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setMessage('');
            }, 2000); // Close automatically after 2 seconds
        } catch (err) {
            console.error('Failed to send request', err);
        }
    };

    if (!isOpen) return null;

    const matchData = response?.data;
    const isComplete = matchData?.isComplete;

    // Helper to color-code the score
    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden relative">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Compatibility Score</h2>
                    <p className="text-sm text-gray-500 mb-8">
                        {targetType === 'ROOM' ? 'Evaluating property fit...' : 'Evaluating lifestyle harmony...'}
                    </p>

                    {isLoading && !matchData ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p className="text-gray-600">Initializing matching engine...</p>
                        </div>
                    ) : isError ? (
                        <div className="py-8 text-center">
                            <p className="text-red-600 font-medium mb-3">{errorMessage}</p>
                            <a href="/profile-setup" className="text-sm text-primary underline hover:text-gray-800">
                                Go to Profile Setup →
                            </a>
                        </div>
                    ) : (
                        <>
                            {/* Score Display */}
                            <div className="flex justify-center mb-6">
                                <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreColor(matchData?.score || 0)}`}>
                                    <span className="text-4xl font-bold">
                                        {matchData?.score || 0}%
                                    </span>

                                    {/* Pulsing ring while AI is thinking */}
                                    {!isComplete && (
                                        <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-25 -m-2"></div>
                                    )}
                                </div>
                            </div>

                            {/* Status & Reason */}
                            <div className="min-h-[100px]">
                                {!isComplete ? (
                                    <div className="space-y-3">
                                        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
                                            Baseline Score Acquired
                                        </p>
                                        <p className="text-gray-600 text-sm">
                                            {matchData?.reason}
                                        </p>
                                        <div className="flex items-center justify-center space-x-2 mt-4 text-xs text-gray-500">
                                            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>AI analyzing nuanced compatibility...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3 animate-fade-in-up">
                                        <p className="text-sm font-semibold text-green-600 uppercase tracking-wider flex items-center justify-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                            Hybrid AI Analysis Complete
                                        </p>
                                        <p className="text-gray-700 text-sm italic">
                                            "{matchData?.reason}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Button */}
                            <div className="mt-6 border-t pt-6">
                                {success ? (
                                    <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200 font-medium">
                                        Request sent successfully! Check your inbox.
                                    </div>
                                ) : (
                                    <>
                                        {isComplete && (
                                            <div className="mb-4 animate-fade-in-up">
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Add a quick intro message (Optional)"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                                                    rows="2"
                                                ></textarea>
                                            </div>
                                        )}

                                        {sendError && (
                                            <div className="mb-4 text-xs text-red-600 bg-red-50 p-2 rounded">
                                                {sendError.data?.message || 'Failed to send request.'}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleSendRequest}
                                            disabled={!isComplete || isSending}
                                            className="w-full py-3 px-4 bg-primary text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex justify-center items-center"
                                        >
                                            {isSending ? (
                                                <span className="animate-pulse">Sending...</span>
                                            ) : isComplete ? (
                                                'Send Connection Request'
                                            ) : (
                                                'Waiting for AI...'
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>
                        </>


                    )}
                </div>
            </div>
        </div>
    );
}