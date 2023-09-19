import {
  CLERK,
  FOOD,
  MONEY,
  TAX,
  TAX_CENTER,
  WATER,
  WOOD,
  WORKER,
} from "./constants";
import type { Actor, LabelType, MarketPlace, TaxCentre, Worker } from "./logic";
import { getGlobalQOL, isWorker } from "./logic";

const resourceLabelDic: Record<string, string> = {
  food: FOOD,
  water: WATER,
  money: MONEY,
  wood: WOOD,
  tax_rate: TAX,
} satisfies Record<LabelType, string>;

const appendElement = (text: string | number, parent: null | Element) => {
  const element = document.createElement("div");
  element.innerHTML = `${text}`;
  parent?.appendChild(element);
};

function showActor(actor: Actor) {
  const parent = document.getElementById("root");

  const worker = document.createElement("div");
  worker.className = "worker";
  worker.id = actor.id;
  parent?.appendChild(worker);

  const resourceList = Object.entries(actor.resources);
  // show death if at least one resource has been depleted
  if (
    resourceList.some(([type, quantity]) => type !== "money" && quantity <= 0)
  )
    return worker.append("👻");

  // add worker's icon (🧑‍🌾, 🧑‍💼, 🏛️)
  let workerIcon = actor.type === "money" ? CLERK : WORKER;
  if (!isWorker(actor)) workerIcon = TAX_CENTER;
  appendElement(workerIcon, worker);

  // add resources for each worker (💰, 🍎, 💧, 🪵)
  const resourceContainer = document.createElement("div");
  resourceList.forEach(([type, quantity]) => {
    const resourceText = `<label>${
      resourceLabelDic[type] ?? "???"
    }</label><label>${quantity}</label>`;
    appendElement(resourceText, resourceContainer);
  });
  worker.appendChild(resourceContainer);
}

const clearElement = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = "";
};

const showElement = (id: string, text: string | number) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = `${text}`;
};

export function show(time: number, actors: Actor[], marketplace: MarketPlace) {
  showElement("timer", time);
  showElement("marketplace-prices", JSON.stringify(marketplace.prices));
  showElement("qol", getGlobalQOL(actors.filter(isWorker)));
  clearElement("root");

  actors.forEach((actor) => showActor(actor));
}
