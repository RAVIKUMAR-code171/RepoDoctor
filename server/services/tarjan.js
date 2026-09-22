// server/services/tarjan.js
// PHASE 2b: Detects circular dependencies using Tarjan's Strongly Connected
// Components (SCC) algorithm.
//
// Intuition: if file A imports B, B imports C, and C imports back A, those
// three files form a cycle - none of them can be fully understood or
// safely changed in isolation. Tarjan's finds every such cluster in one pass.
// Implemented iteratively (not recursively) so large repos don't blow the
// call stack.

function findStronglyConnectedComponents(nodes, adjacency) {
  let index = 0;
  const indices = {};
  const lowlink = {};
  const onStack = {};
  const stack = [];
  const result = [];

  for (const node of nodes) {
    if (indices[node] === undefined) {
      strongConnect(node);
    }
  }

  function strongConnect(startNode) {
    // Manual call-stack simulation of the recursive Tarjan algorithm
    const callStack = [{ node: startNode, neighborIndex: 0 }];
    indices[startNode] = index;
    lowlink[startNode] = index;
    index++;
    stack.push(startNode);
    onStack[startNode] = true;

    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];
      const { node } = frame;
      const neighbors = adjacency[node] || [];

      if (frame.neighborIndex < neighbors.length) {
        const neighbor = neighbors[frame.neighborIndex];
        frame.neighborIndex++;

        if (indices[neighbor] === undefined) {
          indices[neighbor] = index;
          lowlink[neighbor] = index;
          index++;
          stack.push(neighbor);
          onStack[neighbor] = true;
          callStack.push({ node: neighbor, neighborIndex: 0 });
        } else if (onStack[neighbor]) {
          lowlink[node] = Math.min(lowlink[node], indices[neighbor]);
        }
      } else {
        // Done with all neighbors of this node
        callStack.pop();

        if (callStack.length > 0) {
          const parent = callStack[callStack.length - 1].node;
          lowlink[parent] = Math.min(lowlink[parent], lowlink[node]);
        }

        // If this node is the "root" of an SCC, pop the whole cluster off the stack
        if (lowlink[node] === indices[node]) {
          const scc = [];
          let member;
          do {
            member = stack.pop();
            onStack[member] = false;
            scc.push(member);
          } while (member !== node);
          result.push(scc);
        }
      }
    }
  }

  return result;
}

/**
 * @param {string[]} nodes
 * @param {Object} adjacency - file -> array of files it imports
 * @returns {{ cycles: string[][], filesInCycles: Set<string> }}
 *   cycles = only the SCCs with 2+ files (true circular dependency clusters)
 *   filesInCycles = flat set of every file that's part of some cycle,
 *   for quick lookup during scoring
 */
function detectCircularDependencies(nodes, adjacency) {
  const allComponents = findStronglyConnectedComponents(nodes, adjacency);

  // A single-node SCC only counts as a cycle if the file imports itself directly.
  const cycles = allComponents.filter(scc => {
    if (scc.length > 1) return true;
    const [only] = scc;
    return (adjacency[only] || []).includes(only);
  });

  const filesInCycles = new Set();
  cycles.forEach(scc => scc.forEach(f => filesInCycles.add(f)));

  return { cycles, filesInCycles };
}

module.exports = { detectCircularDependencies };
