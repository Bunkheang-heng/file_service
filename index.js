const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/public', express.static('public'));

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the upload directory based on file type
    let uploadDir = 'uploads';
    if (file.mimetype.startsWith('image/')) {
      uploadDir = 'public/images';
    }
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept images and all other files
    cb(null, true);
  }
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'File Services API is running' });
});

// Upload file
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const isImage = req.file.mimetype.startsWith('image/');
  const fileUrl = isImage 
    ? `/public/images/${req.file.filename}`
    : `/download/${req.file.filename}`;
    
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: req.file.path,
    url: fileUrl,
    isImage: isImage
  });
});

// Get all files
app.get('/files', (req, res) => {
  const uploadDir = 'uploads';
  const imagesDir = 'public/images';
  
  const files = {
    uploads: fs.existsSync(uploadDir) ? fs.readdirSync(uploadDir) : [],
    images: fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : []
  };
  
  res.json(files);
});

// Get all images
app.get('/images', (req, res) => {
  const imagesDir = 'public/images';
  if (!fs.existsSync(imagesDir)) {
    return res.json({ images: [] });
  }
  const images = fs.readdirSync(imagesDir);
  res.json({ images });
});

// Get specific image by filename
app.get('/images/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = path.join(__dirname, 'public/images', filename);
  
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  
  // Send the image file
  res.sendFile(imagePath);
});

// Download file
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  res.download(filePath);
});

// Delete file
app.delete('/files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);
  const imagePath = path.join(__dirname, 'public/images', filename);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ message: 'File deleted successfully' });
  }
  
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
    return res.json({ message: 'Image deleted successfully' });
  }
  
  res.status(404).json({ error: 'File not found' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 