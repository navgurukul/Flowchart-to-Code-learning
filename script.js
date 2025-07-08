// Assuming the selectors identified in the previous step are correct.
// If not, these will need to be updated.

document.addEventListener('DOMContentLoaded', () => {
  const inputOutputPanel = document.querySelector('#input-output-panel') || document.querySelector('.input-output-panel');
  const codeEditorPane = document.querySelector('#code-editor-pane') || document.querySelector('.code-editor-pane');

  if (inputOutputPanel) {
    inputOutputPanel.style.display = 'none';
  } else {
    console.warn('Input & Output panel not found. Cannot collapse.');
  }

  if (codeEditorPane) {
    codeEditorPane.style.display = 'none';
  } else {
    console.warn('Code Editor pane not found. Cannot collapse.');
  }

  // Create toggle buttons
  const showCodeEditorButton = document.createElement('button');
  showCodeEditorButton.textContent = 'Show Code Editor';
  showCodeEditorButton.id = 'toggle-code-editor-btn';

  const showInputOutputButton = document.createElement('button');
  showInputOutputButton.textContent = 'Show Input & Output';
  showInputOutputButton.id = 'toggle-input-output-btn';

  // Add buttons to the page (e.g., append to body or a specific container)
  // This part might need adjustment based on the actual page structure.
  // For now, let's assume there's a general container for these buttons or append to body.
  let buttonContainer = document.querySelector('#ui-toggle-buttons-container');
  if (!buttonContainer) {
    console.warn('Button container #ui-toggle-buttons-container not found. Appending buttons to body.');
    buttonContainer = document.body;
  }
  // Ensure buttons are appended before adding event listeners to them.
  buttonContainer.appendChild(showCodeEditorButton);
  buttonContainer.appendChild(showInputOutputButton);

  // Add event listeners to toggle buttons
  if (codeEditorPane) {
    showCodeEditorButton.addEventListener('click', () => {
      const isHidden = codeEditorPane.style.display === 'none';
      codeEditorPane.style.display = isHidden ? '' : 'none'; // Toggle display
      showCodeEditorButton.textContent = isHidden ? 'Hide Code Editor' : 'Show Code Editor';
      // Note: If code execution should happen upon showing, trigger it here.
      // For now, per requirements, no auto-run.
    });
  } else {
    // Disable or hide button if its panel doesn't exist
    showCodeEditorButton.disabled = true;
    showCodeEditorButton.title = "Code editor panel not found";
    console.warn('Code Editor pane not found. Toggle button will be disabled.');
  }

  if (inputOutputPanel) {
    showInputOutputButton.addEventListener('click', () => {
      const isHidden = inputOutputPanel.style.display === 'none';
      inputOutputPanel.style.display = isHidden ? '' : 'none'; // Toggle display
      showInputOutputButton.textContent = isHidden ? 'Hide Input & Output' : 'Show Input & Output';
      // Note: If any action (like fetching I/O data) should happen upon showing, trigger it here.
    });
  } else {
    // Disable or hide button if its panel doesn't exist
    showInputOutputButton.disabled = true;
    showInputOutputButton.title = "Input/Output panel not found";
    console.warn('Input & Output panel not found. Toggle button will be disabled.');
  }
});
