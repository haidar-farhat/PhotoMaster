import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Slider, 
  TextField, 
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import CropIcon from '@mui/icons-material/Crop';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import InvertColorsIcon from '@mui/icons-material/InvertColors';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import { replacePhoto } from '../services/api';

// TabPanel component for the editor tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`editor-tabpanel-${index}`}
      aria-labelledby={`editor-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Add imageSrcUrl prop
function ImageEditor({ open, onClose, photo, onSave, imageSrcUrl }) {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const [tabValue, setTabValue] = useState(0);
  const [originalImage, setOriginalImage] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.5);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageHistory, setImageHistory] = useState([]);
  const [isImageLoading, setIsImageLoading] = useState(false); // Add loading state for image

  // Initialize the canvas when the component mounts or when the photo changes
  useEffect(() => {
    if (open && photo) {
      // Initialize Fabric.js canvas
      if (!fabricCanvasRef.current) {
        fabricCanvasRef.current = new fabric.Canvas(canvasRef.current, {
          width: 800,
          height: 600,
          backgroundColor: '#f0f0f0'
        });
      }

      // Load the image
      if (imageSrcUrl) {
        setIsImageLoading(true);
        loadImage();
      }

      // Clean up function
      return () => {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
        }
      };
    }
  }, [open, photo, imageSrcUrl]); // Keep imageSrcUrl in dependency array

  // Load the image into the canvas using the provided URL
  const loadImage = () => {
    // Use imageSrcUrl if available, otherwise return (or handle error)
    if (!imageSrcUrl || !fabricCanvasRef.current) {
      console.error("ImageEditor: imageSrcUrl not provided or canvas not ready.");
      setIsImageLoading(false);
      return; 
    }

    console.log("Loading image from URL:", imageSrcUrl);
    
    // Add cache buster to URL
    const cacheBusterUrl = `${imageSrcUrl}${imageSrcUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Important for canvas operations if image is from another origin
    
    img.onload = () => {
      try {
        console.log("Image loaded successfully, dimensions:", img.width, "x", img.height);
        
        // Create a fabric image object
        const fabricImage = new fabric.Image(img, {
          selectable: false,
          evented: false,
          centeredScaling: true
        });

        // Clear the canvas
        fabricCanvasRef.current.clear();

        // Calculate the scale to fit the image within the canvas
        const scale = Math.min(
          fabricCanvasRef.current.width / img.width,
          fabricCanvasRef.current.height / img.height
        );

        // Set the image dimensions
        fabricImage.scaleX = scale;
        fabricImage.scaleY = scale;

        // Center the image on the canvas
        fabricCanvasRef.current.centerObject(fabricImage);

        // Add the image to the canvas
        fabricCanvasRef.current.add(fabricImage);
        fabricCanvasRef.current.renderAll();

        // Store the original image for history
        setOriginalImage(fabricImage);
        setImageHistory([fabricImage]);

        // Reset state related to previous image if necessary
        setRotationAngle(0);
        setIsGrayscale(false);
        setWatermarkText('');
        
        setIsImageLoading(false);
      } catch (fabricError) {
        console.error('Error creating Fabric image:', fabricError);
        setIsImageLoading(false);
      }
    };
    
    img.onerror = (error) => {
      console.error('Error loading image source:', imageSrcUrl, error);
      setIsImageLoading(false);
    };
    
    // Set the source after setting up event handlers
    img.src = cacheBusterUrl;  // Use modified URL with cache buster
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    // If we're leaving the crop tab and cropping is active, apply the crop
    if (tabValue === 0 && isCropping) {
      applyCrop();
    }
    
    setTabValue(newValue);
  };

  // Start cropping
  const startCropping = () => {
    if (!fabricCanvasRef.current) return;

    // Remove any existing crop rectangle
    if (cropRect) {
      fabricCanvasRef.current.remove(cropRect);
    }

    // Create a new crop rectangle
    const rect = new fabric.Rect({
      width: 200,
      height: 200,
      fill: 'rgba(0,0,0,0.2)',
      stroke: 'rgba(255,255,255,0.8)',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      transparentCorners: false,
      cornerColor: 'white',
      cornerStrokeColor: 'black',
      borderColor: 'white',
      cornerSize: 10,
      padding: 0,
      cornerStyle: 'circle',
      hasRotatingPoint: false
    });

    // Center the rectangle on the canvas
    fabricCanvasRef.current.centerObject(rect);
    fabricCanvasRef.current.add(rect);
    fabricCanvasRef.current.setActiveObject(rect);
    fabricCanvasRef.current.renderAll();

    setCropRect(rect);
    setIsCropping(true);
  };

  // Apply the crop
  const applyCrop = () => {
    if (!fabricCanvasRef.current || !cropRect) return;

    // Get the crop rectangle coordinates
    const rect = cropRect;
    const canvas = fabricCanvasRef.current;
    
    // Get the image
    const objects = canvas.getObjects();
    const image = objects.find(obj => obj.type === 'image');
    
    if (!image) return;

    // Calculate the actual crop coordinates relative to the image
    const imgLeft = image.left - (image.width * image.scaleX) / 2;
    const imgTop = image.top - (image.height * image.scaleY) / 2;
    
    const cropX = (rect.left - imgLeft) / image.scaleX;
    const cropY = (rect.top - imgTop) / image.scaleY;
    const cropWidth = rect.width / image.scaleX;
    const cropHeight = rect.height / image.scaleY;

    // Create a new cropped image
    image.clipPath = new fabric.Rect({
      left: cropX,
      top: cropY,
      width: cropWidth,
      height: cropHeight,
      absolutePositioned: true
    });

    // Save to history
    saveToHistory();

    // Remove the crop rectangle
    canvas.remove(rect);
    canvas.renderAll();
    
    setCropRect(null);
    setIsCropping(false);
  };

  // Cancel cropping
  const cancelCrop = () => {
    if (!fabricCanvasRef.current || !cropRect) return;

    // Remove the crop rectangle
    fabricCanvasRef.current.remove(cropRect);
    fabricCanvasRef.current.renderAll();
    
    setCropRect(null);
    setIsCropping(false);
  };

  // Rotate the image
  const rotateImage = (angle) => {
    if (!fabricCanvasRef.current) return;

    // Get the image
    const objects = fabricCanvasRef.current.getObjects();
    const image = objects.find(obj => obj.type === 'image');
    
    if (!image) return;

    // Apply the rotation
    image.rotate(angle);
    fabricCanvasRef.current.renderAll();
    
    // Update the rotation angle
    setRotationAngle(angle);

    // Save to history
    saveToHistory();
  };

  // Add watermark
  const addWatermark = () => {
    if (!fabricCanvasRef.current || !watermarkText) return;

    // Create a text object for the watermark
    const text = new fabric.Text(watermarkText, {
      fontSize: 30,
      fill: 'rgba(255,255,255,' + watermarkOpacity + ')',
      fontFamily: 'Arial',
      selectable: true,
      evented: true,
      centeredScaling: true,
      shadow: new fabric.Shadow({
        color: 'rgba(0,0,0,0.6)',
        blur: 3,
        offsetX: 2,
        offsetY: 2
      })
    });

    // Center the watermark on the canvas
    fabricCanvasRef.current.centerObject(text);
    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();

    // Save to history
    saveToHistory();
  };

  // Apply grayscale filter
  const applyGrayscale = () => {
    if (!fabricCanvasRef.current) return;

    // Get the image
    const objects = fabricCanvasRef.current.getObjects();
    const image = objects.find(obj => obj.type === 'image');
    
    if (!image) return;

    // Apply or remove grayscale filter
    if (!isGrayscale) {
      image.filters.push(new fabric.Image.filters.Grayscale());
    } else {
      image.filters = image.filters.filter(filter => !(filter instanceof fabric.Image.filters.Grayscale));
    }
    
    // Apply the filters
    image.applyFilters();
    fabricCanvasRef.current.renderAll();
    
    // Toggle grayscale state
    setIsGrayscale(!isGrayscale);

    // Save to history
    saveToHistory();
  };

  // Save the edited image
  const saveImage = async () => {
    if (!fabricCanvasRef.current || !photo) return;

    setIsSaving(true);

    try {
      // Convert the canvas to a data URL
      const dataURL = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 0.8
      });

      // Send the image to the backend
      await replacePhoto(photo.id, dataURL);

      // Call the onSave callback
      if (onSave) {
        onSave();
      }

      // Close the editor
      onClose();
    } catch (error) {
      console.error('Error saving edited image:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save the current state to history
  const saveToHistory = () => {
    if (!fabricCanvasRef.current) return;

    // Create a JSON representation of the canvas
    const json = fabricCanvasRef.current.toJSON();
    
    // Add to history
    setImageHistory(prev => [...prev, json]);
  };

  // Undo the last action
  const undoAction = () => {
    if (!fabricCanvasRef.current || imageHistory.length <= 1) return;

    // Remove the last item from history
    const newHistory = [...imageHistory];
    newHistory.pop();
    setImageHistory(newHistory);

    // Load the previous state
    const previousState = newHistory[newHistory.length - 1];
    
    if (typeof previousState === 'object' && previousState.type === 'image') {
      // It's an image object, add it directly
      fabricCanvasRef.current.clear();
      fabricCanvasRef.current.add(previousState);
      fabricCanvasRef.current.renderAll();
    } else {
      // It's a JSON state, load it
      fabricCanvasRef.current.loadFromJSON(previousState, () => {
        fabricCanvasRef.current.renderAll();
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        Edit Image: {photo?.filename}
        <IconButton 
          onClick={undoAction} 
          disabled={imageHistory.length <= 1}
          sx={{ position: 'absolute', right: 64 }}
        >
          <Tooltip title="Undo">
            <UndoIcon />
          </Tooltip>
        </IconButton>
        <IconButton 
          onClick={saveImage} 
          disabled={isSaving}
          sx={{ position: 'absolute', right: 16 }}
        >
          <Tooltip title="Save">
            <SaveIcon />
          </Tooltip>
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', height: '100%' }}>
          {/* Canvas Container */}
          <Box 
            sx={{ 
              flex: 1, 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: '#e0e0e0',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            // In the return statement's canvas element:
            {/* Canvas element with fixed dimensions */}
                        <canvas 
                          ref={canvasRef} 
                          style={{
                            width: '800px',
                            height: '600px'
                          }}
                        />
            
            {(isSaving || isImageLoading) && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)'
                }}
              >
                <CircularProgress color="primary" />
                <Typography variant="body2" color="white" sx={{ ml: 2 }}>
                  {isSaving ? 'Saving...' : 'Loading image...'}
                </Typography>
              </Box>
            )}
          </Box>
          
          {/* Tools Panel */}
          <Box sx={{ width: 300, borderLeft: '1px solid #e0e0e0' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab icon={<CropIcon />} label="Crop" />
              <Tab icon={<RotateRightIcon />} label="Rotate" />
              <Tab icon={<TextFieldsIcon />} label="Watermark" />
              <Tab icon={<InvertColorsIcon />} label="Effects" />
            </Tabs>
            
            {/* Crop Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="body2" gutterBottom>
                Draw a rectangle to crop the image.
              </Typography>
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button 
                  variant="contained" 
                  onClick={startCropping}
                  disabled={isCropping}
                >
                  Start Cropping
                </Button>
                
                {isCropping && (
                  <>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      onClick={applyCrop}
                    >
                      Apply
                    </Button>
                    
                    <Button 
                      variant="outlined" 
                      color="error" 
                      onClick={cancelCrop}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </Box>
            </TabPanel>
            
            {/* Rotate Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="body2" gutterBottom>
                Rotate the image by adjusting the angle.
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography id="rotation-slider" gutterBottom>
                  Rotation Angle: {rotationAngle}°
                </Typography>
                
                <Slider
                  value={rotationAngle}
                  onChange={(e, newValue) => rotateImage(newValue)}
                  aria-labelledby="rotation-slider"
                  min={0}
                  max={360}
                  step={5}
                />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => rotateImage((rotationAngle - 90) % 360)}
                  >
                    Rotate -90°
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    onClick={() => rotateImage((rotationAngle + 90) % 360)}
                  >
                    Rotate +90°
                  </Button>
                </Box>
              </Box>
            </TabPanel>
            
            {/* Watermark Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="body2" gutterBottom>
                Add a text watermark to the image.
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Watermark Text"
                  variant="outlined"
                  fullWidth
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  margin="normal"
                />
                
                <Typography id="opacity-slider" gutterBottom>
                  Opacity: {watermarkOpacity}
                </Typography>
                
                <Slider
                  value={watermarkOpacity}
                  onChange={(e, newValue) => setWatermarkOpacity(newValue)}
                  aria-labelledby="opacity-slider"
                  min={0.1}
                  max={1}
                  step={0.1}
                />
                
                <Button 
                  variant="contained" 
                  onClick={addWatermark}
                  disabled={!watermarkText}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  Add Watermark
                </Button>
              </Box>
            </TabPanel>
            
            {/* Effects Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="body2" gutterBottom>
                Apply effects to the image.
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Button 
                  variant="contained" 
                  onClick={applyGrayscale}
                  fullWidth
                >
                  {isGrayscale ? 'Remove Grayscale' : 'Convert to Grayscale'}
                </Button>
              </Box>
            </TabPanel>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button 
          onClick={saveImage} 
          color="primary" 
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImageEditor;
