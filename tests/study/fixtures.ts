export const BIOLOGY_TEXT = `
# Cell Structure and Function

The cell is the basic unit of life. Cells are classified as prokaryotic or eukaryotic based on whether they have a nucleus.

A mitochondrion is a membrane-bound organelle that supplies chemical energy to the cell. Mitochondria are often called the powerhouse of the cell because they produce ATP through cellular respiration. The number of mitochondria per cell varies depending on the cell's energy needs.

The cell membrane is a lipid bilayer that separates the interior of the cell from the external environment. It regulates what enters and exits the cell through selective permeability. Phospholipids form the fundamental structure of the membrane.

Photosynthesis is the process by which green plants convert light energy into chemical energy. It occurs in chloroplasts, which contain the pigment chlorophyll. The overall equation for photosynthesis produces glucose and oxygen from carbon dioxide and water.

DNA is the genetic material in all living organisms. Deoxyribonucleic acid carries the hereditary information from parent to offspring. DNA replication is a semi-conservative process that ensures accurate transmission of genetic information.

## Cellular Respiration

Cellular respiration is the metabolic process that cells use to produce energy. The process releases approximately 36 ATP molecules per glucose molecule. Glycolysis is the first step, occurring in the cytoplasm without oxygen.

The Krebs cycle takes place in the mitochondrial matrix. It generates high-energy electron carriers NADH and FADH2. The electron transport chain is embedded in the inner mitochondrial membrane.

Oxygen serves as the final electron acceptor in aerobic respiration. When oxygen is absent, cells resort to anaerobic respiration or fermentation. Fermentation produces l lactose and 2 ATP per glucose molecule.
`;

export const PHYSICS_TEXT = `
# Newton's Laws of Motion

Newton's first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an unbalanced force. This tendency is called inertia.

The second law of motion relates force, mass, and acceleration through the equation F = ma. Force is measured in newtons (N). Mass is measured in kilograms (kg). Acceleration is measured in meters per second squared (m/s^2).

Newton's third law states that for every action there is an equal and opposite reaction. This means forces always occur in pairs. When you push against a wall, the wall pushes back with equal force.

## Work and Energy

Work is defined as force applied over a distance. The formula for work is W = Fd cos(theta). When force and displacement are parallel, the angle theta is zero and work is maximized.

Kinetic energy is the energy of motion. An object with mass m moving at velocity v has kinetic energy KE = 1/2 mv^2. Doubling the velocity quadruples the kinetic energy.

Potential energy is stored energy due to position or configuration. Gravitational potential energy near Earth's surface is PE = mgh where g is 9.8 m/s^2 and h is the height above a reference point.

## Thermodynamics

The first law of thermodynamics states that energy cannot be created or destroyed, only transformed. The change in internal energy equals heat added minus work done by the system.

Heat is energy transferred due to a temperature difference. The specific heat capacity of water is 4.18 J/g°C. This means 4.18 joules are needed to raise 1 gram of water by 1 degree Celsius.

Entropy is a measure of disorder or randomness in a system. The second law of thermodynamics states that the total entropy of an isolated system can never decrease over time.
`;

export const CS_TEXT = `
# Data Structures and Algorithms

An algorithm is a finite sequence of well-defined instructions used to solve a class of problems. Algorithms are evaluated based on correctness, efficiency, and simplicity.

Big O notation describes the upper bound of an algorithm's growth rate. An algorithm with O(n^2) complexity has a running time that grows quadratically with input size n. An O(log n) algorithm grows logarithmically.

A binary search tree is a data structure that maintains sorted data for efficient lookup. Each node has at most two children, left and right. The left subtree contains keys smaller than the parent node.

## Sorting Algorithms

Merge sort is a divide-and-conquer algorithm with O(n log n) time complexity. It recursively splits the input in half, sorts each half, and merges them back together. Merge sort is a stable sort.

Quick sort is another divide-and-conquer sorting algorithm. It selects a pivot element and partitions the array around the pivot. Average-case time complexity is O(n log n), but worst-case degrades to O(n^2).

The space complexity of an algorithm measures the amount of memory it requires. Merge sort requires O(n) extra space for the temporary arrays during merging.

## Graph Algorithms

A graph consists of vertices connected by edges. In a weighted graph, each edge has an associated cost or distance. Depth-first search explores as far as possible before backtracking.

Dijkstra's algorithm finds the shortest path from a source to all other nodes in a graph with non-negative weights. It uses a priority queue to process nodes in order of distance. The algorithm terminates when all nodes have been visited.
`;
