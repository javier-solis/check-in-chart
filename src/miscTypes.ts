import { z } from "zod";

export enum Color {
  Green = "#68ba7f",
  DarkGreen = "#2e6f40",
  Red = "red",
  Yellow = "yellow",
  Gray = "grey",
  Orange = "orange"
}

export enum Status {
  OnTime = "ONTIME",
  OnTimeOverride = "ONTIMEOVERRIDE",
  Late = "LATE",
  Absent = "ABSENT",
  InvalidInactive = "INVALIDINACTIVE",
  // todo: add property for invalid due to duplicate qr code
}

export const URLSchema = z.string().url();
export type ValidURL = z.infer<typeof URLSchema>;
