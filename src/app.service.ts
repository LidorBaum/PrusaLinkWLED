import { Injectable } from '@nestjs/common'
import axios from 'axios'
import { ERROR_JSON, FINISHED_JSON, IPrinterState, SWITCHING_FILAMENT_JSON, UPDATE_WLED_TYPE } from './utils'

export const LEDS = 91
const ROWS = 1
const LedsPerPercent = LEDS / ROWS / 100
const WLED = 'http://10.100.102.48'
const PrusaLink = 'http://10.100.102.44/api/v1/status'
const PrusaAPIKey = '9FBiNgGe3yrQJ2U'
const PrusaReqConfig = {
  headers: {
    'X-Api-Key': PrusaAPIKey,
  },
}
@Injectable()
export class AppService {
  async lifeCheck() {
    const res = await axios.get(`${WLED}/json/info`)
    if (res.status !== 200) {
      throw new Error('WLED is not available')
    }
    const prusaRes = await axios.get(PrusaLink, {
      headers: {
        'X-Api-Key': PrusaAPIKey,
      },
    })
    if (prusaRes.status !== 200) {
      throw new Error('Prusa is not available')
    }
    return true
  }

  async getPrinterState(): Promise<IPrinterState> {
    // return {
    //   job: {
    //     id: 9,
    //     progress: 58,
    //     time_remaining: 59100,
    //     time_printing: 14,
    //   },
    //   printer: {
    //     state: PrusaLinkPrinterStates.IDLE,
    //     temp_bed: 60.4,
    //     target_bed: 60.0,
    //     temp_nozzle: 170.0,
    //     target_nozzle: 215.0,
    //     axis_z: 371.2,
    //     flow: 100,
    //     speed: 100,
    //     fan_hotend: 6681,
    //     fan_print: 0,
    //   },
    // }
    const initialState = await axios.get(PrusaLink, PrusaReqConfig)
    return initialState.data
  }

  async updateWLED(updateType: UPDATE_WLED_TYPE, percentage?: number) {
    let json: any
    switch (updateType) {
      case UPDATE_WLED_TYPE.PRINTING: {
        json = this.prepareMatrix('colorRedBreath', 'colorGreenGradient', percentage)
        break
      }
      case UPDATE_WLED_TYPE.HEATING: {
        json = this.prepareMatrix('colorBlueBreath', 'colorRedGradient', percentage)
        break
      }
      case UPDATE_WLED_TYPE.IDLE: {
        json = this.prepareMatrix('colorOrangePrusa', 'colorOrangePrusa', 100)
        break
      }
      case UPDATE_WLED_TYPE.SWITCHING_FILAMENT: {
        json = SWITCHING_FILAMENT_JSON
        break
      }
      case UPDATE_WLED_TYPE.ERROR: {
        json = ERROR_JSON
        break
      }
      case UPDATE_WLED_TYPE.FINISHED: {
        json = FINISHED_JSON
        break
      }
    }
    await axios.post(`${WLED}/json`, json)
  }

  prepareMatrix(baseColor: string, fillColor: string, percaentage: number) {
    const segmentsArray = []
    let lightenLeds = Math.floor(percaentage * LedsPerPercent + 1)
    if (lightenLeds === 0) lightenLeds = 1
    for (let i = 0; i < ROWS; i++) {
      let segLight
      let segOff
      if (i % 2 == 0) {
        segLight = {
          stop: LEDS - i * (LEDS / ROWS),
          start: LEDS - (lightenLeds + i * (LEDS / ROWS)),
          ...this.getSegmentColor(fillColor, lightenLeds),
          bri: 255,
          status: 'LIGHTEN of first row',
        }
        segOff = {
          stop: LEDS - (lightenLeds + i * (LEDS / ROWS)),
          start: LEDS - (LEDS / ROWS) * (i + 1),
          bri: 255,
          ...this.getSegmentColor(baseColor, lightenLeds),
          status: 'RED of first row',
        }
        segmentsArray.push(segOff, segLight)
      } else {
        segOff = {
          start: i * (LEDS / ROWS),
          stop: (LEDS / ROWS) * 2 - lightenLeds,
          bri: 255,
          ...this.getSegmentColor(baseColor, lightenLeds),
          status: 'RED of second row',
        }
        segLight = {
          start: (LEDS / ROWS) * 2 - lightenLeds,
          stop: (LEDS / ROWS) * (i + 1),
          ...this.getSegmentColor(fillColor, lightenLeds),
          bri: 255,
          status: 'LIGHTEN of second row',
        }

        segmentsArray.push(segOff, segLight)
      }
    }
    const json = this.getLEDJson(segmentsArray)
    return json
  }

  getSegmentColor(color, lightenLeds) {
    const colors = {
      colorOrangePrusa: {
        col: [
          [250, 123, 33],
          [200, 100, 0],
          [0, 0, 0],
        ],
        fx: 46,
        ix: LEDS / 2,
        sx: 120,
        rev: true,
      },
      colorRedBreath: {
        col: [
          [255, 0, 0, 0],
          [220, 60, 60, 0],
          [255, 120, 150, 0],
        ],
        fx: 2,
        ix: Math.floor((LEDS - lightenLeds) / 3 + 3),
        sx: 100,
        rev: true,
      },
      colorGreenGradient: {
        col: [
          [0, 255, 0, 0],
          [60, 200, 60, 0],
          [0, 0, 0, 0],
        ],
        fx: 46,
        sx: 240,
        ix: Math.floor(lightenLeds / 3 + 2),
        rev: true,
      },
      colorBlueBreath: {
        col: [
          [0, 0, 250, 0],
          [100, 100, 250, 0],
          [0, 0, 0, 0],
        ],
        fx: 2,
        ix: Math.floor((LEDS - lightenLeds) / 3 + 3),
        sx: 100,
        rev: true,
      },
      colorRedGradient: {
        col: [
          [255, 120, 0, 0],
          [220, 60, 60, 0],
          [255, 120, 150, 0],
        ],
        fx: 46,
        sx: 200,
        ix: Math.floor(lightenLeds / 3 + 3),
        rev: true,
      },
    }
    return colors[color]
  }

  getLEDJson(segmentsArray) {
    return {
      on: true,
      bri: 255,
      seg: segmentsArray,
    }
  }
}
