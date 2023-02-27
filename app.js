import { Color } from "three";
import { IfcViewerAPI } from "web-ifc-viewer";
import { IFCLoader } from "web-ifc-three/IFCLoader";
import {
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCDOOR,
  IFCWINDOW,
  IFCFURNISHINGELEMENT,
  IFCMEMBER,
  IFCPLATE,
} from "web-ifc";

// List of categories names
const categories = {
  IFCWALLSTANDARDCASE,
  IFCSLAB,
  IFCFURNISHINGELEMENT,
  IFCDOOR,
  IFCWINDOW,
  IFCPLATE,
  IFCMEMBER,
};

const ifcLoader = new IFCLoader();
// Gets the name of a category
function getName(category) {
  const names = Object.keys(categories);
  return names.find((name) => categories[name] === category);
}
async function getAll(category) {
  const manager = ifcLoader.ifcManager;
  console.log(manager);
  return manager.getAllItemsOfType(0, category, false);
}

// Creates a new subset containing all elements of a category
async function newSubsetOfType(category) {
  const ids = await getAll(category);
  return ifcLoader.ifcManager.createSubset({
    modelID: 0,
    scene,
    ids,
    removePrevious: true,
    customID: category.toString(),
  });
}
const subsets = {};

async function setupAllCategories() {
  const allCategories = Object.values(categories);
  for (let i = 0; i < allCategories.length; i++) {
    const category = allCategories[i];
    console.log(category);
    await setupCategory(category);
  }
}
// Creates a new subset and configures the checkbox
async function setupCategory(category) {
  subsets[category] = await newSubsetOfType(category);
  setupCheckBox(category);
  console.log(subsets);
}

// Sets up the checkbox event to hide / show elements
function setupCheckBox(category) {
  const name = getName(category);
  const checkBox = document.getElementById(name);
  checkBox.addEventListener("change", (event) => {
    const checked = event.target.checked;
    const subset = subsets[category];
    if (checked) scene.add(subset);
    else subset.removeFromParent();
  });
}
// lilgui
const lilguiparams = {
  bgc: { r: 64, g: 64, b: 64 },
  showaxis: false,
  showgrid: false,
  showmonaco: false,
};

const pane = new Tweakpane.Pane();
const container = document.getElementById("viewer-container");
const monacoel = document.querySelectorAll(".monaco-editor-container");
const viewer = new IfcViewerAPI({
  container,
  backgroundColor: new Color().setRGB(
    lilguiparams.bgc.r / 255,
    lilguiparams.bgc.g / 255,
    lilguiparams.bgc.b / 255
  ),
});
// viewer.grid.setGrid();
// viewer.axes.setAxes();

async function loadIfc(url) {
  const model = await viewer.IFC.loadIfcUrl(url);
  viewer.shadowDropper.renderShadow(model.modelID);
  await setupAllCategories();
}

loadIfc("/01.ifc");

const selectScene = pane.addBlade({
  view: "list",
  label: "scene",
  options: [
    { text: "ifc-house1", value: "01" },
    { text: "ifc-house2", value: "02" },
    { text: "m-house1", value: "03" },
  ],
  value: "01",
});

const showmonaco = pane.addInput(lilguiparams, "showmonaco");
const showaxis = pane.addInput(lilguiparams, "showaxis");
const showgrid = pane.addInput(lilguiparams, "showgrid");

const colorinput = pane.addInput(lilguiparams, "bgc");

selectScene.on("change", function (ev) {
  loadIfc(`/${ev.value}.ifc`);
});
showmonaco.on("change", function (ev) {
  if (ev.value) {
    // console.log(monacoel);
    monacoel[0].classList.remove("hidden");
  } else {
    monacoel[0].classList.add("hidden");
  }
});

showgrid.on("change", function (ev) {
  if (ev.value) {
    viewer.grid.setGrid();
  } else {
    viewer.grid.dispose();
  }
});

showaxis.on("change", function (ev) {
  if (ev.value) {
    viewer.axes.setAxes();
  } else {
    viewer.axes.dispose();
  }
});

colorinput.on("change", function (ev) {
  viewer.context.options.backgroundColor.setRGB(
    lilguiparams.bgc.r / 255,
    lilguiparams.bgc.g / 255,
    lilguiparams.bgc.b / 255
  );
});

window.onclick = async () => {
  const { modelID, id } = await viewer.IFC.selector.pickIfcItem(true);
  const props = await viewer.IFC.getProperties(modelID, id, true, false);
  editor.setValue(JSON.stringify(props, null, 4));
  //   editor.trigger("fold", "editor.foldAll");
};
// window.ondblclick = viewer.IFC.selector.highlightIfcItem(true);
// // window.ondblclick = () => viewer.IFC.selector.highlightIfcItem(true);
// window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();
viewer.clipper.active = true;

window.onkeydown = (event) => {
  if (event.code === "KeyP") {
    viewer.clipper.createPlane();
  } else if (event.code === "KeyO") {
    viewer.clipper.deletePlane();
  }
};
