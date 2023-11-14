import { CronJob } from 'cron'

const LEDS = 91
export const CronCustomExpressions = {
  EVERY_5_SECONDS: '0,5,10,15,20,25,30,35,40,45,50,55 * * * * *',
  EVERY_10_SECONDS: '0,10,20,30,40,50 * * * * *',
  EVERY_1_MINUTE: '0 * * * * *',
  EVERY_1_SECOND: '* * * * * *',
}

export interface ICronsMap {
  [key: string]: {
    stateToReturn: IPrinterStateEnum
    stopCrons: CronJob[]
    startCron: CronJob
    condition?: {
      check: boolean
      stopCrons: CronJob[]
      startCron: CronJob
      stateToReturn: IPrinterStateEnum
    }
  }
}

export enum UPDATE_WLED_TYPE {
  HEATING = 'HEATING',
  PRINTING = 'PRINTING',
  IDLE = 'IDLE',
  IDLE_HOT = 'IDLE_HOT',
  ERROR = 'ERROR',
  FINISHED = 'FINISHED',
  SWITCHING_FILAMENT = 'SWITCHING_FILAMENT',
}

export enum PrusaLinkPrinterStates {
  IDLE = 'IDLE',
  PRINTING = 'PRINTING',
  BUSY = 'BUSY',
  FINISHED = 'FINISHED',
  ATTENTION = 'ATTENTION',
}
export interface IPrinterState {
  job: {
    id: number
    progress: number
    time_remaining: number
    time_printing: number
  }
  printer: {
    state: PrusaLinkPrinterStates
    temp_bed: number
    target_bed: number
    temp_nozzle: number
    target_nozzle: number
    axis_z: number
    axis_x?: number
    axis_y?: number
    flow: number
    speed: number
    fan_hotend: number
    fan_print: number
  }
}

export enum IPrinterStateEnum {
  PrintingPercentage = 'PrintingPercentage', //Red-Green for Printing Percentage
  PrintingHeating = 'PrintingHeating', //Red-Blue for heating Percentage
  PrintingFinished = 'PrintingFinished', //Fireworks until coming IDLE
  PrintingError = 'PrintingError', //Red-White for Error
  Idle = 'Idle', //Gradient Prusa Orange
  UnloadingFilament = 'UnloadingFilament', //not decided yet
  LoadingFilament = 'LoadingFilament', //not decided yet
  SwitchingFilament = 'SwitchingFilament', //Magenta-Cyan switching Animation
}

export const emptySegments = [
  { stop: 0 },
  { stop: 0 },
  { stop: 0 },
  { stop: 0 },
  { stop: 0 },
  { stop: 0 },
  { stop: 0 },
  { stop: 0 },
  { stop: 0 },
  { stop: 0 },
]

export const IDLE_JSON = {
  on: true,
  bri: 255,
  seg: [
    {
      start: 0,
      stop: LEDS,
      col: [
        [250, 123, 33],
        [200, 100, 0],
        [0, 0, 0],
      ],
      fx: 46,
      ix: LEDS / 3,
      sx: 80,
      rev: true,
    },
    ...emptySegments,
  ],
}

export const IDLE_HOT_JSON = {
  on: true,
  bri: 255,
  seg: [
    {
      start: 0,
      stop: LEDS,
      col: [
        [250, 123, 33],
        [255, 0, 0],
        [255, 0, 0],
      ],
      fx: 46,
      ix: 200,
      sx: 150,
      rev: true,
    },
    ...emptySegments,
  ],
}
export const SWITCHING_FILAMENT_JSON = {
  on: true,
  bri: 255,
  seg: [
    {
      start: 0,
      stop: LEDS,
      col: [
        [0, 150, 250, 0],
        [250, 60, 120, 0],
        [0, 0, 0, 0],
      ],
      fx: 50,
      sx: 100,
      ix: 255,
    },
    ...emptySegments,
  ],
}

export const ERROR_JSON = {
  on: true,
  bri: 255,
  seg: [
    {
      col: [
        [255, 0, 0, 0],
        [250, 250, 250, 0],
        [200, 0, 0, 0],
      ],
      fx: 158,
      start: 0,
      stop: LEDS,
      sx: 0,
      ix: 255,
      c1: 128,
      c2: 128,
      c3: 16,
    },
    ...emptySegments,
  ],
}

export const FINISHED_JSON = {
  on: true,
  bri: 255,
  seg: [
    {
      col: [
        [8, 255, 0, 0],
        [9, 255, 0],
        [0, 55, 255],
      ],
      fx: 64,
      sx: 156,
      ix: 119,
      start: 0,
      stop: LEDS,
      c1: 128,
      c2: 128,
      c3: 16,
    },
    ...emptySegments,
  ],
}
