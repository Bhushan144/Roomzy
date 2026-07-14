import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUploadPhotosMutation } from '../../store/api/inventoryApi';

export default function ManagePhotos() {
  const { id: listingId } = useParams();
  const navigate = useNavigate();
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [validationError, setValidationError] = useState('');
  
  const [uploadPhotos, { isLoading, error }] = useUploadPhotosMutation();

  const handleFileSelect = (e) => {
    setValidationError('');
    const files = Array.from(e.target.files);

    // Frontend Business Rules Validation
    if (files.length > 5) {
      setValidationError('You can only upload a maximum of 5 photos at once.');
      return;
    }

    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setValidationError('Only image files (JPG, PNG, WEBP) are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setValidationError(`File ${file.name} exceeds the 5MB limit.`);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      setPreviews(newPreviews);
    }
  };

  const clearSelection = () => {
    setSelectedFiles([]);
    setPreviews([]);
    setValidationError('');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    // Construct the FormData payload
    const formData = new FormData();
    selectedFiles.forEach(file => {
      // 'photos' MUST match the field name expected by Multer on the backend
      formData.append('photos', file); 
    });

    try {
      await uploadPhotos({ listingId, formData }).unwrap();
      navigate('/dashboard'); // Return to dashboard on success
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Property Photos</h2>
      <p className="text-gray-500 mb-6">Upload up to 5 high-quality images for your listing.</p>

      {validationError && (
        <div className="mb-6 p-3 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
          {validationError}
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-red-50 text-red-800 text-sm rounded border border-red-200">
          {error.data?.message || 'Failed to upload photos to the server.'}
        </div>
      )}

      {/* The Dropzone / Input Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:bg-gray-50 transition-colors">
        <input 
          type="file" 
          id="photo-upload" 
          multiple 
          accept="image/jpeg, image/png, image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
          </svg>
          <span className="text-gray-900 font-medium text-lg">Click to select files</span>
          <span className="text-gray-500 text-sm mt-1">JPG, PNG or WEBP (Max 5MB per file)</span>
        </label>
      </div>

      {/* Image Preview Grid */}
      {previews.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Selected Files ({previews.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {previews.map((src, index) => (
              <div key={index} className="relative pt-[100%] rounded-md overflow-hidden border border-gray-200 shadow-sm">
                <img 
                  src={src} 
                  alt={`Preview ${index}`} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          
          <div className="flex justify-end space-x-4 border-t pt-4">
            <button 
              onClick={clearSelection}
              disabled={isLoading}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Clear Selection
            </button>
            <button 
              onClick={handleUpload}
              disabled={isLoading}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading to Cloudinary...
                </>
              ) : 'Upload Photos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}