// src/data/guideSteps.ts

export interface GuideStepContent {
  title: string;
  content: string; // Could be React.ReactNode if we need rich text/components directly
  imagePlaceholder?: string; // Description of an ideal image/SVG
}

export const guideSteps: GuideStepContent[] = [
  {
    title: "Welcome to Flowchart to Code AI!",
    content: "Let's take a quick tour of the main features to get you started on your journey from visual logic to executable code.",
    imagePlaceholder: "App logo or a friendly welcome graphic with abstract flowchart shapes"
  },
  {
    title: "Flowchart Elements (Nodes)",
    content: "You'll use different types of nodes to build your flowcharts: Start/End (oval), Process (rectangle for actions/calculations), Input/Output (parallelogram for data entry/display), Decision (diamond for conditional branches like if/else), and Loop (e.g., a modified hexagon or specific loop construct for iterations like while/for). Each node type has a distinct shape and purpose in defining your program's logic.",
    imagePlaceholder: "A visually clear collage of the different node types (Start, End, Process, Input/Output, Decision, Loop) with their names."
  },
  {
    title: "Building Your Flowchart",
    content: "To construct your flowchart, simply drag the required node types from the side panel (usually on the left) onto the main canvas. Once a node is on the canvas, you can click it to select it and then edit its properties in a details panel. This includes changing text labels, defining conditions for decision nodes, or specifying variable names for inputs.",
    imagePlaceholder: "An animation or a clear static image showing a hand cursor dragging a 'Process' node from a side panel onto the flowchart canvas, and an arrow pointing to an 'Edit Properties' area."
  },
  {
    title: "Connecting Nodes",
    content: "Establish the logical sequence by connecting nodes. Typically, you'll click (or click and drag) from small circular 'handles' or connection points on one node to a handle on another node. This draws an edge (a line with an arrowhead) indicating the direction of program flow. For Decision nodes, you'll usually draw two edges: one for the 'true'/'yes' path and one for the 'false'/'no' path.",
    imagePlaceholder: "An animation or image depicting a cursor drawing an edge from a 'Process' node to a 'Decision' node. Show distinct 'Yes' and 'No' paths coming from the Decision node."
  },
  {
    title: "Generate and Run Code",
    content: "After designing your flowchart, click the 'Generate Code' button. The system will translate your visual logic into Python code, displayed in the code editor. Then, press 'Run Code' to execute this generated code against the current exercise's predefined test cases and inputs.",
    imagePlaceholder: "A two-panel image: Left side shows a flowchart with a 'Generate Code' button highlighted. Right side shows the corresponding generated Python code in an editor, with a 'Run Code' button highlighted."
  },
  {
    title: "Output, Feedback & Iteration",
    content: "The 'Input & Output' panel is crucial for feedback. It displays the output of your code, any runtime errors, and a clear indication of whether your solution passed the exercise's tests (e.g., 'Correct Output!' or 'Incorrect, try again'). Use this information to debug and iteratively refine your flowchart logic until you successfully solve the problem.",
    imagePlaceholder: "A screenshot of the 'Input & Output' panel. One example showing a 'Correct Output' message with green checkmark, and another showing an 'Error' or 'Incorrect Output' message with a red X."
  },
  {
    title: "AI Chat Assistant",
    content: "Feeling stuck or want to explore a concept? The AI Chatbot is here to help! Type `/learn <topic>` (e.g., `/learn for loops`) to get explanations of programming concepts. Use `/generate <description>` (e.g., `/generate a flowchart for login validation`) to get a starting flowchart for a task. This is a powerful tool for learning and unblocking yourself.",
    imagePlaceholder: "A friendly chatbot icon next to a speech bubble showing examples: `/learn variables` and `/generate simple calculator`."
  }
];
