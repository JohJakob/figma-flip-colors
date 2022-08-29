import clone from './clone';

const styleIdType = "styleId";
const colorType = "color";

// Get colors of selection as String Array
const getColorsRecursively = (selection) => {
  let colors = [];

  for (const node of selection) {
    // Recursively get fill colors of child nodes
    // Ignores children of boolean operation nodes
    if ("children" in node && node.type !== "BOOLEAN_OPERATION" && node.visible) {
      colors.push(getColorsRecursively(node.children).flat());
    }

    // Only process visible nodes
    if (node.type !== "GROUP" && node.visible) {
      // Get fill colors
      if (node.fillStyleId === figma.mixed) {
        // Ignore multiple fill style IDs for now
        figma.notify("Multiple colour styles in one object are not supported yet.");

        /*
        // Get fill style ID of first character of text nodes with multiple fill style IDs
        if (node.type === "TEXT") {
          let fillStyleId = node.getRangeFillStyleId(0, 1) as string;

          // Only get the fill style id if the first character has one
          if (fillStyleId.length > 0) {
            fills.push(styleIdPrefix + fillStyleId);
          }
        } else {
          // Are there more nodes that can have multiple fill style IDs?
        }
        */
      } else if (node.fillStyleId.length > 0) {
        // Get fill style ID
        colors.push({ type: styleIdType, value: node.fillStyleId });
      } else if ("fills" in node) {
        // Get visible fill colors
        node.fills.forEach((e) => {
          if (e.visible) {
            colors.push({ type: colorType, value: JSON.stringify(e) });
          }
        });
      }

      // Get stroke colors
      if (node.strokeStyleId.length > 0) {
        // Get stroke style ID
        colors.push({ type: styleIdType, value: node.strokeStyleId });
      } else if ("strokes" in node) {
        // Get visible stroke colors
        node.strokes.forEach((e) => {
          if (e.visible) {
            colors.push({ type: colorType, value: JSON.stringify(e) });
          }
        });
      }
    }
  }

  return colors;
}

// Flip two fill colors in selection
const flipColors = (selection, colors) => {
  const newSelection = selection.slice();

  for (const node of newSelection) {
    // Recursively flip fill colors in child nodes
    // Ignores children of boolean operation nodes
    if ("children" in node && node.type !== "BOOLEAN_OPERATION" && node.visible) {
      flipColors(node.children, colors);
    }

    // Only process visible nodes
    if (node.type !== "GROUP" && node.visible) {
      let fills = clone(node.fills);
      let fillStyleId = clone(node.fillStyleId);
      let strokes = clone(node.strokes);
      let strokeStyleId = clone(node.strokeStyleId);

      // Set fill colors
      if (fillStyleId === figma.mixed) {
        // Ignore multiple fill style IDs for now
      } else if (fillStyleId !== figma.mixed && fillStyleId.length > 0) {
        if (fillStyleId === colors[0].value) {
          if (colors[1].type === styleIdType) {
            fillStyleId = colors[1].value;
          } else {
            fills[0] = colors[1].value;
            fillStyleId = "";
          }
        } else if (fillStyleId === colors[1].value) {
          if (colors[0].type === styleIdType) {
            fillStyleId = colors[0].value;
          } else {
            fills[0] = colors[0].value;
            fillStyleId = "";
          }
        }
      } else if ("fills" in node) {
        fills.forEach((fill, index) => {
          if (JSON.stringify(fill) === JSON.stringify(colors[0].value)) {
            if (colors[1].type === styleIdType) {
              fillStyleId = colors[1].value;
            } else {
              fills[index] = colors[1].value;
              fillStyleId = "";
            }
          } else if (JSON.stringify(fill) === JSON.stringify(colors[1].value)) {
            if (colors[0].type === styleIdType) {
              fillStyleId = colors[0].value;
            } else {
              fills[index] = colors[0].value;
              fillStyleId = "";
            }
          }
        });
      }

      // Set stroke colors
      if (strokeStyleId === figma.mixed) {
        // Ignore multiple stroke style IDs for now
      } else if (strokeStyleId !== figma.mixed && strokeStyleId.length > 0) {
        if (strokeStyleId === colors[0].value) {
          if (colors[1].type === styleIdType) {
            strokeStyleId = colors[1].value;
          } else {
            strokes[0] = colors[1].value;
            strokeStyleId = "";
          }
        } else if (strokeStyleId === colors[1].value) {
          if (colors[0].type === styleIdType) {
            strokeStyleId = colors[0].value;
          } else {
            strokes[0] = colors[0].value;
            strokeStyleId = "";
          }
        }
      } else if ("strokes" in node) {
        strokes.forEach((stroke, index) => {
          if (JSON.stringify(stroke) === JSON.stringify(colors[0].value)) {
            if (colors[1].type === styleIdType) {
              strokeStyleId = colors[1].value;
            } else {
              strokes[index] = colors[1].value;
              strokeStyleId = "";
            }
          } else if (JSON.stringify(stroke) === JSON.stringify(colors[1].value)) {
            if (colors[0].type === styleIdType) {
              strokeStyleId = colors[0].value;
            } else {
              strokes[index] = colors[0].value;
              strokeStyleId = "";
            }
          }
        });
      }

      // Apply new fills and fill style ID to node
      node.fills = fills;
      node.fillStyleId = fillStyleId;

      // Apply new strokes and stroke style ID to node
      node.strokes = strokes;
      node.strokeStyleId = strokeStyleId;
    }
  }

  return newSelection;
}

if (figma.currentPage.selection.length === 0) {
  figma.closePlugin("You have not selected anything.");
}

// Workaround: Get colors as String Array and add them to a set to remove duplicates
let allColorsUnfiltered = getColorsRecursively(figma.currentPage.selection).flat();

let plainColorSet = new Set();
let styleIdSet = new Set();

let allColors = [];

allColorsUnfiltered.forEach((e: { type: string, value: string }) => {
  if (e.type === colorType) {
    plainColorSet.add(e.value);
  } else if (e.type === styleIdType) {
    styleIdSet.add(e.value);
  }
});

// Parse stringified unique plain colors as objects and add them to color array
plainColorSet.forEach((e: string) => {
  allColors.push({ type: colorType, value: JSON.parse(e) });
});

// Add unique style IDs to color array
styleIdSet.forEach((e: string) => {
  allColors.push({ type: styleIdType, value: e });
});

allColors = allColors.flat();

// TODO: Extend plugin to let user choose which colors to flip when there are more than two colors in the selection
if (allColors.length > 2) {
  figma.closePlugin("Your selection contains more than 2 colours.");
} else if (allColors.length < 2) {
  figma.closePlugin("Your selection contains less than 2 colours.");
} else {
  figma.currentPage.selection = flipColors(figma.currentPage.selection, allColors);
}

figma.closePlugin();
