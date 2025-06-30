// Placeholder for VariablePanel.js
// This component will display the current state of variables in the simulation.

export class VariablePanel {
  constructor(containerElement) {
    this.container = containerElement;
    // TODO: Initialize panel structure
    this.container.innerHTML = '<h4>Variables</h4><div class="variable-list"></div>';
    this.variableListElement = this.container.querySelector('.variable-list');
  }

  update(variables) {
    // variables is an object like { varName1: value1, varName2: value2 }
    // TODO: Clear previous variable display
    // TODO: Iterate through variables and display them
    if (!this.variableListElement) return;

    this.variableListElement.innerHTML = ''; // Clear previous entries

    if (Object.keys(variables).length === 0) {
      this.variableListElement.innerHTML = '<p>No variables defined yet.</p>';
      return;
    }

    const ul = document.createElement('ul');
    for (const varName in variables) {
      if (variables.hasOwnProperty(varName)) {
        const li = document.createElement('li');
        li.textContent = `${varName}: ${JSON.stringify(variables[varName])}`; // JSON.stringify for complex values
        ul.appendChild(li);
      }
    }
    this.variableListElement.appendChild(ul);
    console.log("VariablePanel: Updated with variables", variables);
  }

  reset() {
    if (!this.variableListElement) return;
    this.variableListElement.innerHTML = '<p>No variables defined yet.</p>';
    console.log("VariablePanel: Reset");
  }
}
