# 🤖 Client-Side YOLO - Run Object Detection in Browser

## 🎯 Goal
Run YOLO object detection **directly in the browser** to detect hand-drawn flowchart shapes from images - no backend needed!

---

## 🚀 Solution Options

### Option 1: TensorFlow.js + YOLO (Recommended)
**Pros:**
- ✅ Runs entirely in browser
- ✅ Good performance with WebGL
- ✅ Pre-trained models available
- ✅ Easy to use

**Cons:**
- ⚠️ Model file ~10-20MB (one-time download)
- ⚠️ Slower than server-side (but acceptable)

### Option 2: ONNX Runtime Web
**Pros:**
- ✅ Faster than TensorFlow.js
- ✅ Smaller model size
- ✅ Better optimization

**Cons:**
- ⚠️ More complex setup
- ⚠️ Less documentation

**Recommendation: Use TensorFlow.js** - easier and well-documented!

---

## 📦 Implementation Plan

### Step 1: Install Dependencies

```bash
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd
```

**What these do:**
- `@tensorflow/tfjs` - TensorFlow.js core library
- `@tensorflow-models/coco-ssd` - Pre-trained object detection model

---

### Step 2: Create YOLO Detection Service

**File:** `src/services/yoloDetection.ts`

```typescript
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

class YOLODetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading = false;

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return;
    
    this.isLoading = true;
    console.log('🤖 Loading YOLO model...');
    
    try {
      // Load pre-trained COCO-SSD model (lightweight YOLO alternative)
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // Faster, smaller model
      });
      console.log('✅ YOLO model loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load YOLO model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async detectObjects(imageElement: HTMLImageElement): Promise<Detection[]> {
    if (!this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error('Model not loaded');
    }

    console.log('🔍 Running object detection...');
    const predictions = await this.model.detect(imageElement);
    
    console.log(`✅ Found ${predictions.length} objects`);
    return predictions;
  }

  async detectFlowchartShapes(file: File): Promise<{
    shapes: Array<{
      type: 'start' | 'process' | 'decision' | 'input' | 'output';
      bbox: [number, number, number, number];
      confidence: number;
    }>;
    imageUrl: string;
  }> {
    // Create image element from file
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    // Detect objects
    const detections = await this.detectObjects(img);

    // Map detected objects to flowchart shapes
    const shapes = detections.map(detection => {
      const shapeType = this.mapToFlowchartShape(detection.class);
      return {
        type: shapeType,
        bbox: detection.bbox,
        confidence: detection.score
      };
    }).filter(shape => shape.type !== null);

    return {
      shapes: shapes as any,
      imageUrl
    };
  }

  private mapToFlowchartShape(detectedClass: string): string | null {
    // Map COCO-SSD classes to flowchart shapes
    // This is a simple mapping - you can train a custom model for better results
    const mapping: Record<string, string> = {
      'circle': 'start',
      'oval': 'start',
      'rectangle': 'process',
      'square': 'process',
      'diamond': 'decision',
      'parallelogram': 'input'
    };

    return mapping[detectedClass.toLowerCase()] || null;
  }

  isModelLoaded(): boolean {
    return this.model !== null;
  }
}

// Export singleton instance
export const yoloService = new YOLODetectionService();
```

---

### Step 3: Update FlowchartBuilder Component

**File:** `src/components/FlowchartBuilder.tsx`

Replace the `handleImageUpload` function:

```typescript
import { yoloService } from '../services/yoloDetection';

// Add state for loading
const [isDetecting, setIsDetecting] = useState(false);

const handleImageUpload = async (file: File) => {
  if (!file) return;

  setIsDetecting(true);
  
  try {
    // Show loading message
    toast.loading('🤖 AI is analyzing your flowchart...', { id: 'yolo-detection' });

    // Run YOLO detection in browser
    const result = await yoloService.detectFlowchartShapes(file);

    if (result.shapes.length === 0) {
      toast.error('No flowchart shapes detected. Try a clearer image.', { id: 'yolo-detection' });
      return;
    }

    // Convert detected shapes to flowchart nodes
    const nodes: FlowchartNode[] = result.shapes.map((shape, index) => {
      const [x, y, width, height] = shape.bbox;
      
      return {
        id: `detected-${index}`,
        type: shape.type,
        position: { x: x * 2, y: y * 2 }, // Scale up for better visibility
        data: { 
          label: shape.type.toUpperCase(),
          confidence: Math.round(shape.confidence * 100)
        }
      };
    });

    // Update flowchart with detected nodes
    setNodes(nodes);
    setEdges([]); // Clear edges, user can connect them

    toast.success(`✅ Detected ${nodes.length} shapes!`, { id: 'yolo-detection' });

    // Optional: Show the original image as reference
    console.log('Original image:', result.imageUrl);

  } catch (error) {
    console.error('Detection error:', error);
    toast.error('Failed to analyze image. Please try again.', { id: 'yolo-detection' });
  } finally {
    setIsDetecting(false);
  }
};

// Update the button
<button
  onClick={triggerImageUpload}
  disabled={isDetecting}
  className={`flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-md hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md ${
    isDetecting ? 'opacity-50 cursor-not-allowed' : ''
  }`}
  title="AI-Powered: Convert hand-drawn flowchart using browser-based YOLO"
>
  {isDetecting ? (
    <>
      <div className="w-3 h-3 sm:w-4 sm:h-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
      <span className="hidden sm:inline">Analyzing...</span>
    </>
  ) : (
    <>
      <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
      <span className="hidden sm:inline">AI Import</span>
    </>
  )}
</button>
```

---

### Step 4: Pre-load Model on App Start (Optional)

**File:** `src/App.tsx`

Add this in `useEffect`:

```typescript
useEffect(() => {
  // Pre-load YOLO model in background
  yoloService.loadModel().catch(err => {
    console.warn('Failed to pre-load YOLO model:', err);
  });
}, []);
```

---

## 🎨 Better Option: Custom Flowchart Shape Detection

For **better accuracy**, you can use a custom-trained model specifically for flowchart shapes:

### Option A: Use MediaPipe (Google's Solution)

```bash
npm install @mediapipe/tasks-vision
```

```typescript
import { ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';

// Load custom flowchart detection model
const vision = await FilesetResolver.forVisionTasks(
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
);

const objectDetector = await ObjectDetector.createFromOptions(vision, {
  baseOptions: {
    modelAssetPath: '/models/flowchart-detector.tflite' // Your custom model
  },
  runningMode: 'IMAGE'
});
```

### Option B: Train Your Own Model

1. **Collect training data** - Hand-drawn flowcharts with labeled shapes
2. **Use Roboflow** - Easy model training platform
3. **Export to TensorFlow.js** format
4. **Load in your app**

---

## 📊 Performance Considerations

### Model Size:
- COCO-SSD (lite): ~5MB
- COCO-SSD (full): ~20MB
- Custom model: ~2-10MB

### Speed:
- First load: 2-5 seconds (one-time)
- Detection: 100-500ms per image
- Runs on GPU if available (WebGL)

### Browser Support:
- ✅ Chrome/Edge (best performance)
- ✅ Firefox (good)
- ✅ Safari (slower, but works)
- ❌ IE11 (not supported)

---

## 🚀 Quick Start Implementation

### Minimal Working Example:

```typescript
// 1. Install
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd

// 2. Create service file (copy code above)
// 3. Update FlowchartBuilder (copy code above)
// 4. Test with an image!
```

---

## 🎯 What You'll Get

### Before (Broken Backend):
- ❌ Upload to server
- ❌ Wait for response
- ❌ Server costs
- ❌ Doesn't work

### After (Client-Side):
- ✅ Instant processing in browser
- ✅ No server needed
- ✅ Works offline (after first load)
- ✅ Free!
- ✅ Privacy-friendly (image never leaves browser)

---

## 🔧 Advanced: Custom Flowchart Model

If you want **perfect detection** of flowchart shapes:

### Step 1: Collect Data
- Take 100-200 photos of hand-drawn flowcharts
- Label each shape (start, process, decision, etc.)

### Step 2: Train on Roboflow
1. Upload images to Roboflow.com
2. Label shapes with bounding boxes
3. Train model (free tier available)
4. Export as TensorFlow.js

### Step 3: Use in App
```typescript
const model = await tf.loadGraphModel('/models/custom-flowchart/model.json');
```

---

## 💡 Alternative: Shape Recognition with OpenCV.js

For **simple shape detection** (circles, rectangles, diamonds):

```bash
npm install opencv.js
```

```typescript
import cv from 'opencv.js';

// Detect shapes by contours
const detectShapes = (imageData: ImageData) => {
  const src = cv.matFromImageData(imageData);
  const gray = new cv.Mat();
  const edges = new cv.Mat();
  
  // Convert to grayscale
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  
  // Detect edges
  cv.Canny(gray, edges, 50, 150);
  
  // Find contours
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  
  // Classify shapes by contour properties
  const shapes = [];
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    const area = cv.contourArea(contour);
    const perimeter = cv.arcLength(contour, true);
    
    // Classify based on shape properties
    const shapeType = classifyShape(contour, area, perimeter);
    shapes.push(shapeType);
  }
  
  return shapes;
};
```

---

## ✅ Recommendation

**Start with TensorFlow.js + COCO-SSD** (easiest):
1. Quick to implement (30 minutes)
2. Works reasonably well
3. No training needed
4. Can upgrade to custom model later

**Want me to implement it?** Just say:
```
Implement client-side YOLO detection
```

And I'll add all the code! 🚀
