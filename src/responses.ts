const when100percent = {
  printer: {
    state: 'FINISHED',
    temp_bed: 29.3,
    target_bed: 0.0,
    temp_nozzle: 29.0,
    target_nozzle: 0.0,
    axis_z: 371.2,
    axis_x: 2.0,
    axis_y: 351.0,
    flow: 100,
    speed: 100,
    fan_hotend: 0,
    fan_print: 0,
    status_connect: {
      ok: true,
      message: 'OK',
    },
  },
}

const whenIDLE = {
  printer: {
    state: 'IDLE',
    temp_bed: 29.3,
    target_bed: 0.0,
    temp_nozzle: 30.0,
    target_nozzle: 0.0,
    axis_z: 371.2,
    axis_x: 2.0,
    axis_y: 351.0,
    flow: 100,
    speed: 100,
    fan_hotend: 0,
    fan_print: 0,
    status_connect: {
      ok: true,
      message: 'OK',
    },
  },
}

const whenUnloadingFilament = {
  printer: {
    state: 'BUSY',
    temp_bed: 29.4,
    target_bed: 0.0,
    temp_nozzle: 43.0,
    target_nozzle: 215.0,
    axis_z: 371.2,
    axis_x: 2.0,
    axis_y: 351.0,
    flow: 100,
    speed: 100,
    fan_hotend: 0,
    fan_print: 0,
    status_connect: {
      ok: true,
      message: 'OK',
    },
  },
}

const sentPrint = {
  job: {
    id: 9,
    progress: 0.0,
    time_remaining: 59100,
    time_printing: 14,
  },
  storage: {
    path: '/usb/',
    name: 'usb',
    read_only: false,
  },
  printer: {
    state: 'PRINTING',
    temp_bed: 32.4,
    target_bed: 60.0,
    temp_nozzle: 139.0,
    target_nozzle: 170.0,
    axis_z: 371.2,
    flow: 100,
    speed: 100,
    fan_hotend: 6681,
    fan_print: 0,
    status_connect: {
      ok: true,
      message: 'OK',
    },
  },
}

//! for absorbing heat we should show just red warming light
//! need to check both head and bed
//! when Z homming, the "axis_z" is below 0

const onFilamentChange = {}
const onPause = {}

// TODO: Check what happens when set just preheat
//TODO: Check what happens on change filament mid print
// TODO: Check what happens on pause mid print

const midprintchange = {
  job: {
    id: 9,
    progress: 24.0,
    time_remaining: 44880,
    time_printing: 14854,
  },
  storage: {
    path: '/usb/',
    name: 'usb',
    read_only: false,
  },
  printer: {
    state: 'ATTENTION',
    temp_bed: 60.0,
    target_bed: 60.0,
    temp_nozzle: 219.0,
    target_nozzle: 220.0,
    axis_z: 43.4,
    flow: 100,
    speed: 100,
    fan_hotend: 7035,
    fan_print: 6578,
    status_connect: {
      ok: true,
      message: 'OK',
    },
  },
}
