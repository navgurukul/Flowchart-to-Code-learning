// src/ui/components/Minimap.js

export class Minimap {
  constructor(containerElement, flowchartCanvasInstance, mainViewport) {
    this.container = containerElement;
    this.flowchartCanvas = flowchartCanvasInstance; // Reference to the main canvas to get its content/dimensions
    this.mainViewport = mainViewport; // An object representing the main canvas's viewport { x, y, width, height, totalWidth, totalHeight }

    this.minimapCanvas = document.createElement('canvas');
    this.ctx = this.minimapCanvas.getContext('2d');
    this.container.appendChild(this.minimapCanvas);

    this.scale = 0.1; // Example scale for the minimap

    this.render();
    this.bindEvents();
  }

  updateViewport(newViewport) {
    this.mainViewport = newViewport;
    this.drawViewportRectangle(); // Only redraw the viewport rectangle for efficiency
  }

  render() {
    // 1. Determine the total bounds of the flowchart content from flowchartCanvas or mainViewport
    const totalContentWidth = this.mainViewport.totalWidth || this.container.offsetWidth / this.scale; // Fallback
    const totalContentHeight = this.mainViewport.totalHeight || this.container.offsetHeight / this.scale; // Fallback

    // 2. Set minimap canvas dimensions based on scale
    this.minimapCanvas.width = totalContentWidth * this.scale;
    this.minimapCanvas.height = totalContentHeight * this.scale;
    this.container.style.width = `${this.minimapCanvas.width}px`;
    this.container.style.height = `${this.minimapCanvas.height}px`;

    this.ctx.clearRect(0, 0, this.minimapCanvas.width, this.minimapCanvas.height);

    // 3. Draw a scaled-down representation of the flowchart.
    // This is the complex part. Options:
    //    a) Iterate through all flowchart blocks and draw simplified shapes (rectangles)
    //       at scaled positions.
    //    b) If the main flowchart canvas is a <canvas> element, draw its content
    //       to the minimap canvas using `drawImage` with scaling. This is simpler if possible.
    // For this placeholder, let's assume we draw block outlines.

    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);

    // Example: if flowchartCanvas.getBlocksLayout() returns [{id, x, y, width, height}, ...]
    const blocksLayout = this.flowchartCanvas.getBlocksLayout ? this.flowchartCanvas.getBlocksLayout() : [];
    this.ctx.strokeStyle = 'grey';
    this.ctx.lineWidth = 1 / this.scale; // Keep line width consistent after scaling

    blocksLayout.forEach(block => {
      this.ctx.strokeRect(block.x, block.y, block.width, block.height);
    });

    // Draw connections (simplified)
    // This would also require data from flowchartCanvas about connections

    this.ctx.restore();

    // 4. Draw the viewport rectangle
    this.drawViewportRectangle();
    console.log("Minimap: Rendered");
  }

  drawViewportRectangle() {
    if (!this.mainViewport) return;

    this.ctx.save();
    // Clear only the old viewport rectangle area if possible (more complex)
    // For simplicity, often the minimap content is redrawn quickly or viewport is drawn on top
    // Re-drawing part of the flowchart content that was under the old viewport rect:
    // This clearRect might be too broad if not careful with coordinates.
    // For now, assuming render() cleared everything or this is drawn last.

    this.ctx.strokeStyle = 'blue';
    this.ctx.lineWidth = 2; // Make it stand out
    this.ctx.strokeRect(
      this.mainViewport.x * this.scale,
      this.mainViewport.y * this.scale,
      this.mainViewport.width * this.scale,
      this.mainViewport.height * this.scale
    );
    this.ctx.restore();
    console.log("Minimap: Viewport rectangle drawn");
  }

  bindEvents() {
    this.minimapCanvas.addEventListener('click', (event) => {
      const rect = this.minimapCanvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Convert click coordinates on minimap to main flowchart coordinates (center viewport there)
      const targetX = (clickX / this.scale) - (this.mainViewport.width / 2);
      const targetY = (clickY / this.scale) - (this.mainViewport.height / 2);

      if (this.flowchartCanvas.scrollToCoordinates) {
        this.flowchartCanvas.scrollToCoordinates(targetX, targetY);
      }
      console.log(`Minimap: Clicked at (${clickX}, ${clickY}). Scrolling main to (${targetX}, ${targetY})`);
    });

    // Add drag handling for the viewport rectangle if desired (more complex)
  }

  // This method would be called by the main application when the flowchart changes
  onFlowchartChanged() {
    this.render(); // Re-render the minimap content
  }

  // This method would be called by the main application when the main viewport scrolls/zooms
  onMainViewportChanged(newViewport) {
    this.mainViewport = newViewport;
    // Efficiently, just redraw the flowchart content once and then the viewport rect
    this.render(); // For simplicity, re-render all. Could optimize to only redraw viewport rect on static background.
  }
}

// Conceptual: FlowchartCanvas needs to provide getBlocksLayout() and scrollToCoordinates()
// class FlowchartCanvas {
//   // ... other methods ...
//   getBlocksLayout() {
//     // Return array of {id, x, y, width, height} for all blocks
//     return Object.values(this.blocksData).map(b => ({
//         id: b.id, x: b.x, y: b.y, width: b.width, height: b.height
//     }));
//   }
//   scrollToCoordinates(x, y) {
//     // Logic to scroll the main flowchart view
//     console.log(`FlowchartCanvas: Scrolling to ${x}, ${y}`);
//     // this.viewport.x = x; this.viewport.y = y; this.render();
//   }
// }
