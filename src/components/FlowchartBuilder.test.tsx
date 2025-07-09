import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FlowchartBuilder } from './FlowchartBuilder';
import { Exercise, FlowchartNode } from '../types';

// Mock exercise data
const mockExercise: Exercise = {
  id: 1,
  title: 'Test Exercise',
  description: 'A test exercise for flowchart builder.',
  problemStatement: 'Create a simple flowchart.',
  sampleInput: 'N/A',
  expectedOutput: 'N/A',
  difficulty: 'beginner',
  category: 'General',
  hints: [],
};

// Mock functions
const mockOnGenerateCode = jest.fn();
const mockOnRunCode = jest.fn();

describe('FlowchartBuilder Node Dragging', () => {
  const getInitialNode = (id: string, x: number, y: number, type: FlowchartNode['type'] = 'process'): FlowchartNode => ({
    id,
    type,
    position: { x, y },
    data: { label: `${type} node` },
  });

  test('should allow a node to be dragged multiple times', async () => {
    const initialNodeId = 'node1';
    const initialPosition = { x: 100, y: 100 };
    const drag1Delta = { x: 50, y: 50 };
    const drag2Delta = { x: 30, y: -20 };

    const initialFlowchart = {
      nodes: [getInitialNode(initialNodeId, initialPosition.x, initialPosition.y)],
      edges: [],
    };

    render(
      <FlowchartBuilder
        exercise={mockExercise}
        onGenerateCode={mockOnGenerateCode}
        onRunCode={mockOnRunCode}
        isRunning={false}
        newFlowchartToLoad={initialFlowchart} // Load with an initial node
      />
    );

    // Find the canvas and the node.
    // Nodes are rendered as divs with style.left and style.top.
    // We'll find the node by its text content initially, then verify its position.
    // A more robust way would be to add data-testid to nodes if possible.
    // For now, we assume the label is unique enough for this test.

    // Wait for the node to be rendered from newFlowchartToLoad
    // The node's label is "Process node"
    let nodeElement = await screen.findByText('Process node');
    // The parent div is the draggable element
    nodeElement = nodeElement.closest('div[style*="left: 100px"][style*="top: 100px"]') as HTMLDivElement;
    expect(nodeElement).toBeInTheDocument();

    const canvasElement = nodeElement.parentElement as HTMLDivElement; // Assuming node is direct child of canvas
    expect(canvasElement).toHaveClass('flowchart-dots-bg'); // Verify it's the canvas

    // --- First Drag Operation ---
    // 1. MouseDown on the node
    await act(async () => {
      fireEvent.mouseDown(nodeElement, { clientX: initialPosition.x + 5, clientY: initialPosition.y + 5 }); // Small offset within node
    });

    // 2. MouseMove on the canvas
    await act(async () => {
      fireEvent.mouseMove(canvasElement, {
        clientX: initialPosition.x + 5 + drag1Delta.x,
        clientY: initialPosition.y + 5 + drag1Delta.y,
      });
    });

    // 3. MouseUp on the canvas (or window, but canvas is easier to target here)
    await act(async () => {
      fireEvent.mouseUp(canvasElement);
    });

    // Verify node position after first drag
    const expectedPos1X = initialPosition.x + drag1Delta.x;
    const expectedPos1Y = initialPosition.y + drag1Delta.y;

    // Re-find the node element as its style (and potentially instance) might have changed
    // This check is tricky because React might re-render the element.
    // We check the style attribute.
    nodeElement = await screen.findByText('Process node');
    nodeElement = nodeElement.closest(`div[style*="left: ${expectedPos1X}px"][style*="top: ${expectedPos1Y}px"]`) as HTMLDivElement;
    expect(nodeElement).toBeInTheDocument();
    expect(nodeElement).toHaveStyle(`left: ${expectedPos1X}px`);
    expect(nodeElement).toHaveStyle(`top: ${expectedPos1Y}px`);


    // --- Second Drag Operation ---
    // 1. MouseDown on the node again
    await act(async () => {
      fireEvent.mouseDown(nodeElement, { clientX: expectedPos1X + 5, clientY: expectedPos1Y + 5 });
    });

    // 2. MouseMove on the canvas
    await act(async () => {
      fireEvent.mouseMove(canvasElement, {
        clientX: expectedPos1X + 5 + drag2Delta.x,
        clientY: expectedPos1Y + 5 + drag2Delta.y,
      });
    });

    // 3. MouseUp on the canvas
    await act(async () => {
      fireEvent.mouseUp(canvasElement);
    });

    // Verify node position after second drag
    const expectedPos2X = expectedPos1X + drag2Delta.x;
    const expectedPos2Y = expectedPos1Y + drag2Delta.y;

    nodeElement = await screen.findByText('Process node');
    nodeElement = nodeElement.closest(`div[style*="left: ${expectedPos2X}px"][style*="top: ${expectedPos2Y}px"]`) as HTMLDivElement;
    expect(nodeElement).toBeInTheDocument();
    expect(nodeElement).toHaveStyle(`left: ${expectedPos2X}px`);
    expect(nodeElement).toHaveStyle(`top: ${expectedPos2Y}px`);

    // If we reach here and all assertions pass, the node remained draggable.
  });
});

// Helper to get node by its ID if we assign data-testid or similar
// const getNodeById = (container: HTMLElement, nodeId: string) => {
//   return container.querySelector(`[data-nodeid="${nodeId}"]`);
// };
