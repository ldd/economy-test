import { Worker } from "./Worker";
import { Actor } from "./types";

export function isWorker(actor: Actor): actor is Worker {
  return !("tax_rate" in actor.resources);
}

export function getGlobalQOL(workers: Worker[]) {
  const total = workers.reduce((total, worker) => total + worker.qol(), 0);
  return Math.round((total / workers.length) * 100) / 100;
}
