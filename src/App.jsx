import React, { useState } from 'react';

    export default function App() {
      const [file, setFile] = useState(null);
      const [loading, setLoading] = useState(false);
      const [uploadStatus, setUploadStatus] = useState('');

      const handleFileChange = (e) => {
        setFile(e.target.files[0]);
      };

      const handleUpload = async () => {
        if (!file) {
          alert('Please select a file first!');
          return;
        }

        setLoading(true);
        setUploadStatus('');

        try {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const fileData = e.target.result.split(',')[1];
              const fileExt = file.name.split('.').pop();
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

              const response = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  fileName,
                  fileData
                }),
              });

              // Check if response is JSON
              const contentType = response.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Unexpected response: ${text.substring(0, 100)}`);
              }

              const result = await response.json();
              
              if (!response.ok) {
                throw new Error(result.details || result.error || 'Upload failed');
              }

              if (!result.success) {
                throw new Error(result.details || result.error || 'Upload failed');
              }

              setUploadStatus('Upload successful!');
              setFile(null);
            } catch (error) {
              console.error('Upload error:', error);
              setUploadStatus('Upload failed: ' + error.message);
              // Pass error details to Bolt
              window.Bolt?.logError?.({
                type: 'upload_error',
                message: error.message,
                details: error.stack,
                timestamp: new Date().toISOString()
              });
            } finally {
              setLoading(false);
            }
          };

          reader.onerror = () => {
            throw new Error('File reading failed');
          };

          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error:', error);
          setUploadStatus('Upload failed: ' + error.message);
          // Pass error details to Bolt
          window.Bolt?.logError?.({
            type: 'client_error',
            message: error.message,
            details: error.stack,
            timestamp: new Date().toISOString()
          });
          setLoading(false);
        }
      };

      return (
        <div className="bg-gray-50">
          {/* Previous sections remain the same... */}

          {/* CTA Section */}
          <section id="upload" className="py-24 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-6 text-gray-900">
                  Ready to Improve Your CV?
                </h2>
                <p className="text-xl mb-8 text-gray-600">
                  Upload your CV now and get instant feedback from our AI system.
                </p>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-inner">
                  <input
                    type="file"
                    className="mb-4 w-full p-3 border-2 border-dashed border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={loading}
                  >
                    {loading ? 'Uploading...' : 'Get Your CV Reviewed'}
                  </button>
                  {uploadStatus && (
                    <p className={`mt-4 ${uploadStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
                      {uploadStatus}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      );
    }
