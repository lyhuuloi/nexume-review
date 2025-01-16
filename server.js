import express from 'express';
    import cors from 'cors';
    import { supabase } from './src/supabaseClient.js';

    const app = express();
    const port = 3001;

    // Error logging middleware
    const errorLogger = (error, req, res, next) => {
      console.error('Error:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        error: error.message,
        stack: error.stack,
        body: req.body
      });
      next(error);
    };

    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(errorLogger);

    // Serve static files from the dist directory
    app.use(express.static('dist'));

    // File upload endpoint
    app.post('/api/upload', async (req, res) => {
      try {
        const { fileName, fileData } = req.body;

        if (!fileName || !fileData) {
          return res.status(400).json({ 
            success: false,
            error: 'Missing file data',
            details: 'Both fileName and fileData are required'
          });
        }

        // Validate file size (max 5MB)
        const fileSize = (fileData.length * 3) / 4 - 2; // Approximate size in bytes
        if (fileSize > 5 * 1024 * 1024) {
          return res.status(413).json({
            success: false,
            error: 'File too large',
            details: 'Maximum file size is 5MB'
          });
        }

        const { data, error } = await supabase.storage
          .from('review-uploads')
          .upload(fileName, Buffer.from(fileData, 'base64'), {
            contentType: 'application/octet-stream'
          });

        if (error) {
          console.error('Supabase error:', {
            message: error.message,
            code: error.code,
            details: error.details
          });
          return res.status(500).json({
            success: false,
            error: 'File upload failed',
            details: error.message,
            code: error.code
          });
        }

        res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          filePath: data.path
        });
      } catch (error) {
        console.error('Server error:', {
          message: error.message,
          stack: error.stack,
          body: req.body
        });
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          details: error.message
        });
      }
    });

    // Error handling middleware
    app.use((error, req, res, next) => {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });
    });

    // Handle all other routes
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });

    // Start server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
