// src/engine/versioning.js

const VERSION_HISTORY_STORAGE_KEY_PREFIX = 'flowchartVersionHistory_'; // Prefix for localStorage keys

/**
 * Saves a snapshot of the current flowchart state as a new version.
 *
 * @param {string} flowchartId - A unique identifier for the flowchart.
 * @param {object} flowchartData - The current flowchart data (JSON representation) to save.
 * @param {number} [maxVersions=20] - Maximum number of versions to keep per flowchart. Oldest are pruned.
 * @returns {object|null} The saved version object or null if saving failed.
 */
export function saveFlowchartVersion(flowchartId, flowchartData, maxVersions = 20) {
  if (!flowchartId || !flowchartData) {
    console.error("Flowchart ID and data are required to save a version.");
    return null;
  }

  const storageKey = `${VERSION_HISTORY_STORAGE_KEY_PREFIX}${flowchartId}`;
  let versions = [];
  try {
    const storedVersions = localStorage.getItem(storageKey);
    if (storedVersions) {
      versions = JSON.parse(storedVersions);
    }
  } catch (e) {
    console.error(`Error parsing version history for flowchart ${flowchartId}:`, e);
    // Potentially clear corrupted data or handle gracefully
    versions = [];
  }

  const newVersion = {
    timestamp: Date.now(),
    data: JSON.parse(JSON.stringify(flowchartData)), // Deep copy to avoid mutation
  };

  versions.unshift(newVersion); // Add to the beginning (most recent first)

  // Prune old versions if exceeding maxVersions
  if (versions.length > maxVersions) {
    versions = versions.slice(0, maxVersions);
  }

  try {
    localStorage.setItem(storageKey, JSON.stringify(versions));
    console.log(`Version saved for flowchart ${flowchartId} at ${new Date(newVersion.timestamp).toLocaleString()}`);
    return newVersion;
  } catch (e) {
    console.error(`Error saving version history for flowchart ${flowchartId} to localStorage:`, e);
    // This can happen if localStorage is full
    alert("Failed to save flowchart version. LocalStorage might be full.");
    return null;
  }
}

/**
 * Retrieves all saved versions for a given flowchart.
 *
 * @param {string} flowchartId - The unique identifier for the flowchart.
 * @returns {Array<object>} An array of version objects (timestamp, data), sorted most recent first. Returns empty array if none found or error.
 */
export function getFlowchartVersions(flowchartId) {
  if (!flowchartId) {
    console.error("Flowchart ID is required to retrieve versions.");
    return [];
  }

  const storageKey = `${VERSION_HISTORY_STORAGE_KEY_PREFIX}${flowchartId}`;
  try {
    const storedVersions = localStorage.getItem(storageKey);
    if (storedVersions) {
      return JSON.parse(storedVersions);
    }
  } catch (e) {
    console.error(`Error parsing version history for flowchart ${flowchartId} from localStorage:`, e);
  }
  return [];
}

/**
 * Restores a flowchart to a specific version based on its timestamp.
 * Note: This function itself doesn't update the live application state.
 * It returns the data of the version to restore. The calling code is responsible
 * for applying this data to the active flowchart editor/simulator.
 *
 * @param {string} flowchartId - The unique identifier for the flowchart.
 * @param {number} timestamp - The timestamp of the version to restore.
 * @returns {object|null} The flowchartData of the restored version, or null if not found.
 */
export function restoreFlowchartVersion(flowchartId, timestamp) {
  if (!flowchartId || !timestamp) {
    console.error("Flowchart ID and version timestamp are required to restore.");
    return null;
  }

  const versions = getFlowchartVersions(flowchartId);
  const versionToRestore = versions.find(v => v.timestamp === timestamp);

  if (versionToRestore) {
    console.log(`Version from ${new Date(timestamp).toLocaleString()} found for flowchart ${flowchartId}.`);
    // Return a deep copy to prevent mutation of the stored version
    return JSON.parse(JSON.stringify(versionToRestore.data));
  } else {
    console.warn(`Version with timestamp ${timestamp} not found for flowchart ${flowchartId}.`);
    return null;
  }
}

/**
 * Deletes all version history for a specific flowchart.
 * @param {string} flowchartId - The unique identifier for the flowchart.
 */
export function deleteFlowchartVersions(flowchartId) {
    if (!flowchartId) {
        console.error("Flowchart ID is required to delete versions.");
        return;
    }
    const storageKey = `${VERSION_HISTORY_STORAGE_KEY_PREFIX}${flowchartId}`;
    localStorage.removeItem(storageKey);
    console.log(`All versions for flowchart ${flowchartId} deleted.`);
}

/**
 * Deletes a specific version by its timestamp.
 * @param {string} flowchartId - The unique identifier for the flowchart.
 * @param {number} timestamp - The timestamp of the version to delete.
 * @returns {boolean} True if a version was found and deleted, false otherwise.
 */
export function deleteSingleFlowchartVersion(flowchartId, timestamp) {
    if (!flowchartId || !timestamp) {
        console.error("Flowchart ID and version timestamp are required to delete a specific version.");
        return false;
    }
    const storageKey = `${VERSION_HISTORY_STORAGE_KEY_PREFIX}${flowchartId}`;
    let versions = getFlowchartVersions(flowchartId);
    const initialLength = versions.length;
    versions = versions.filter(v => v.timestamp !== timestamp);

    if (versions.length < initialLength) {
        try {
            localStorage.setItem(storageKey, JSON.stringify(versions));
            console.log(`Version with timestamp ${timestamp} deleted for flowchart ${flowchartId}.`);
            return true;
        } catch (e) {
            console.error(`Error saving updated version history for flowchart ${flowchartId} after deletion:`, e);
            return false;
        }
    }
    return false;
}


// Example Usage:
/*
function runVersioningExample() {
  const flowchartId = "myTestFlowchart123";
  const initialFlowchart = { startBlockId: "start", blocks: [{ id: "start", type: "Start", nextBlock: "end" }, {id: "end", type: "End"}] };
  const updatedFlowchart = { ...initialFlowchart, blocks: [...initialFlowchart.blocks, {id: "proc1", type: "Process", operation: "x=1", nextBlock: "end"}] };
  updatedFlowchart.blocks[0].nextBlock = "proc1"; // Adjust start block's next

  // Clean up previous test runs
  deleteFlowchartVersions(flowchartId);

  console.log("--- Versioning Example ---");

  // Save initial version
  saveFlowchartVersion(flowchartId, initialFlowchart);

  // Simulate some time passing and save another version
  setTimeout(() => {
    const v2 = saveFlowchartVersion(flowchartId, updatedFlowchart);

    if (v2) {
        // List versions
        const versions = getFlowchartVersions(flowchartId);
        console.log(`Found ${versions.length} versions:`);
        versions.forEach(v => console.log(` - ${new Date(v.timestamp).toLocaleString()}`, v.data));

        // Restore the first version (initialFlowchart)
        if (versions.length > 1) {
            const firstVersionTimestamp = versions[versions.length -1].timestamp; // oldest is last after unshift
            const restoredData = restoreFlowchartVersion(flowchartId, firstVersionTimestamp);
            console.log("Restored data from first version:", restoredData);
            if (JSON.stringify(restoredData) === JSON.stringify(initialFlowchart)) {
                console.log("Restoration successful!");
            } else {
                console.error("Restoration failed or data mismatch.");
            }
        }

        // Delete a specific version (the most recent one)
        deleteSingleFlowchartVersion(flowchartId, v2.timestamp);
        const versionsAfterDelete = getFlowchartVersions(flowchartId);
        console.log(`Versions after deleting one: ${versionsAfterDelete.length}`);

    } else {
        console.log("Failed to save second version.");
    }

  }, 100); // Small delay for distinct timestamps
}

// To run in a browser console:
// runVersioningExample();
// To clean up: deleteFlowchartVersions("myTestFlowchart123");
*/
