// src/utils/debounce.js

/**
 * Creates a debounced version of a function that delays invoking the function
 * until after `wait` milliseconds have elapsed since the last time the
 * debounced function was invoked.
 *
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @param {boolean} [immediate=false] Trigger the function on the leading edge instead of the trailing.
 * @returns {Function} The new debounced function.
 */
export function debounce(func, wait, immediate = false) {
  let timeout;

  return function executedFunction(...args) {
    const context = this;

    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

// Example Usage:
/*
function handleResize() {
  console.log("Resized! Width:", window.innerWidth, "Height:", window.innerHeight);
  // Perform expensive resize-related calculations here
}

// Debounce the handleResize function with a wait time of 250ms
const debouncedHandleResize = debounce(handleResize, 250);

window.addEventListener('resize', debouncedHandleResize);

// --- Example for an input field ---
// const inputElement = document.getElementById('myInput');
// function handleInput(event) {
//   console.log("Input value:", event.target.value);
//   // Perform search or validation based on input
// }
// const debouncedHandleInput = debounce(handleInput, 300);
// if(inputElement) inputElement.addEventListener('input', debouncedHandleInput);
*/
