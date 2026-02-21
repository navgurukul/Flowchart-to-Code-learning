import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

interface Detection {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

interface FlowchartShape {
  type: 'start' | 'process' | 'decision' | 'input' | 'output';
  bbox: [number, number, number, number];
  confidence: number;
}

class YOLODetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private isLoading = false;

  async loadModel(): Promise<void> {
    if (this.model || this.isLoading) return;
    
    this.isLoading = true;
    console.log('🤖 Loading AI detection model...');
    
    try {
      // Load pre-trained COCO-SSD model (lightweight YOLO alternative)
      this.model = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // Faster, smaller model (~5MB)
      });
      console.log('✅ AI model loaded successfully!');
    } catch (error) {
      console.error('❌ Failed to load AI model:', error);
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
    
    console.log(`✅ Found ${predictions.length} objects:`, predictions);
    return predictions;
  }

  async detectFlowchartShapes(file: File): Promise<{
    shapes: FlowchartShape[];
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
  }> {
    // Create image element from file
    const imageUrl = URL.createObjectURL(file);
    const img = new Image();
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    console.log(`📐 Image dimensions: ${img.width}x${img.height}`);

    // Detect objects
    const detections = await this.detectObjects(img);

    // Analyze shapes and map to flowchart types
    const shapes = detections
      .map(detection => {
        const shapeType = this.analyzeShape(detection, img.width, img.height);
        if (!shapeType) return null;

        return {
          type: shapeType,
          bbox: detection.bbox,
          confidence: detection.score
        };
      })
      .filter((shape): shape is FlowchartShape => shape !== null);

    console.log(`🎯 Detected ${shapes.length} flowchart shapes`);

    return {
      shapes,
      imageUrl,
      imageWidth: img.width,
      imageHeight: img.height
    };
  }

  private analyzeShape(
    detection: Detection,
    imageWidth: number,
    imageHeight: number
  ): FlowchartShape['type'] | null {
    const [, , width, height] = detection.bbox; // x, y not needed for analysis
    const aspectRatio = width / height;
    const area = width * height;
    const relativeArea = area / (imageWidth * imageHeight);

    console.log(`Analyzing: ${detection.class}, aspect: ${aspectRatio.toFixed(2)}, area: ${relativeArea.toFixed(3)}`);

    // Ignore very small detections (likely noise)
    if (relativeArea < 0.01) {
      console.log('  → Too small, ignoring');
      return null;
    }

    // Ignore very large detections (likely background)
    if (relativeArea > 0.8) {
      console.log('  → Too large, ignoring');
      return null;
    }

    // Map based on shape characteristics and detected class
    const className = detection.class.toLowerCase();

    // Start/End shapes (ovals, circles)
    if (
      className.includes('circle') ||
      className.includes('ball') ||
      className.includes('orange') || // Sometimes circles detected as oranges
      (aspectRatio > 0.8 && aspectRatio < 1.2 && relativeArea < 0.15) // Round-ish
    ) {
      console.log('  → Mapped to START/END');
      return 'start';
    }

    // Decision shapes (diamonds, kites)
    if (
      className.includes('kite') ||
      className.includes('diamond') ||
      (aspectRatio > 0.7 && aspectRatio < 1.3 && relativeArea > 0.05 && relativeArea < 0.25)
    ) {
      console.log('  → Mapped to DECISION');
      return 'decision';
    }

    // Input/Output shapes (parallelograms, trapezoids)
    if (
      className.includes('trapezoid') ||
      className.includes('parallelogram') ||
      (aspectRatio > 1.5 && aspectRatio < 3.0)
    ) {
      console.log('  → Mapped to INPUT/OUTPUT');
      return 'input';
    }

    // Process shapes (rectangles, boxes)
    // Default to process for most rectangular objects
    if (
      className.includes('book') ||
      className.includes('laptop') ||
      className.includes('cell phone') ||
      className.includes('remote') ||
      aspectRatio > 1.2 || aspectRatio < 0.8
    ) {
      console.log('  → Mapped to PROCESS');
      return 'process';
    }

    // If we can't determine, default to process (most common)
    console.log('  → Default to PROCESS');
    return 'process';
  }

  isModelLoaded(): boolean {
    return this.model !== null;
  }

  isModelLoading(): boolean {
    return this.isLoading;
  }
}

// Export singleton instance
export const yoloService = new YOLODetectionService();
