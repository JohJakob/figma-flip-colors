import clone from './clone';

// Get fill colors of selection as String Array
const getColorsRecursively = (selection) => {
  let fills = [];

  for (const node of selection) {
    // Recursively get fill colors of child nodes
    if ("children" in node && node.visible) {
      fills.push(getColorsRecursively(node.children).flat());
    }

    // Get fill color when node is visible
    if ("fills" in node && node.visible) {
      fills.push(JSON.stringify(node.fills));
    }
  }

  return fills;
}

// Flip two fill colors in selection
const flipColors = (selection, allFills) => {
  const newSelection = selection.slice();

  for (const node of newSelection) {
    // Recursively flip fill colors in child nodes
    if ("children" in node && node.visible) {
      flipColors(node.children, allFills);
    }

    // Flip fill colors when node is visible
    if ("fills" in node && node.visible) {
      let fills = clone(node.fills);

      fills.forEach((fill, index) => {
        if (JSON.stringify(fill) === JSON.stringify(allFills[0])) {
          fills[index] = allFills[1];
        } else if (JSON.stringify(fill) === JSON.stringify(allFills[1])) {
          fills[index] = allFills[0];
        }
      });

      node.fills = fills;
    }
  }

  return newSelection;
}

if (figma.currentPage.selection.length === 0) {
  figma.closePlugin("You have not selected anything.");
}

// Workaround: Get fill colors as String Array and add them to a set to remove duplicates
let allFillsStringified = getColorsRecursively(figma.currentPage.selection).flat();
let allFillsSet = new Set();
let allFills = [];

allFillsStringified.forEach((e) => {
  allFillsSet.add(e);
});

// Parse stringified unique fill colors as objects
allFillsSet.forEach((e: string) => {
  allFills.push(JSON.parse(e));
})

allFills = allFills.flat();

// TODO: Extend plugin to let user choose which colors to flip when there are more than two colors in the selection
if (allFills.length > 2) {
  figma.closePlugin("Your selection contains more than 2 fills.");
} else if (allFills.length < 2) {
  figma.closePlugin("Your selection contains less than 2 fills.");
} else {
  figma.currentPage.selection = flipColors(figma.currentPage.selection, allFills);
}

figma.closePlugin();
