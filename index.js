// index.js - Wildcard Route with Regex (Bypassing problematic path-to-regexp parsing)
const express = require('express');
const path = require('path');
const fs = require('fs').promises; // Use promises for async/await
const app = express();
const PORT = 3000;

// --- IMPORTANT: Define a BASE_DIR for security and scope ---
// This sets the root directory that your app will be allowed to browse.
const BASE_DIR = process.cwd(); // Defaults to where this Node.js script is running

// Middleware to parse JSON request bodies
app.use(express.json());

// Basic "Hello World" endpoint
app.get('/', (req, res) => {
  res.send('Hello from AI Termux Backend!');
});

// --- Unified Route for /files and /files/some/path using a Regex ---
// This regex matches /files (optional trailing slash) AND /files/anything/else
// The captured part (anything/else) will be in req.params[0]
app.get(/^\/files(?:\/(.*))?$/, async (req, res) => {
  // req.params[0] will contain the path segment after /files/
  // It will be undefined for /files, and 'some/path' for /files/some/path
  const requestedPath = req.params[0] || '';
  const absolutePath = path.join(BASE_DIR, requestedPath);

  // Security check: Prevent Directory Traversal
  if (!absolutePath.startsWith(BASE_DIR)) {
    return res.status(403).json({ error: 'Access denied: Path outside allowed base directory.' });
  }

  try {
    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    const formattedEntries = entries.map(entry => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
    }));
    res.json({ currentPath: path.relative(BASE_DIR, absolutePath), entries: formattedEntries });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({ error: `Directory or file not found: ${requestedPath}` });
    }
    if (error.code === 'EACCES') {
      return res.status(403).json({ error: `Permission denied to access: ${requestedPath}` });
    }
    console.error(`Error listing directory ${absolutePath}:`, error);
    res.status(500).json({ error: 'Failed to list directory contents.', details: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`AI Termux Backend running on http://localhost:${PORT}`);
  console.log(`Serving files from base directory: ${BASE_DIR}`);
  console.log('You can access it from your mobile app on the same device.');
});
