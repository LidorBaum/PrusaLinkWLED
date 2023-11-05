import { Controller, Logger, OnModuleInit } from '@nestjs/common'
import { AppService, LEDS } from './app.service'
import { CronExpression } from '@nestjs/schedule'
import { CronJob, CronTime } from 'cron'
import {
  CronCustomExpressions,
  ICronsMap,
  IPrinterState,
  IPrinterStateEnum,
  PrusaLinkPrinterStates,
  UPDATE_WLED_TYPE,
} from './utils'

@Controller()
export class AppController implements OnModuleInit {
  private heatingCron: CronJob | null
  private printingCron: CronJob | null
  private IdleCron: CronJob | null
  private switchingFilamentCron: CronJob | null
  private printingFinishedCron: CronJob | null
  private printTime: number | null
  private logger: Logger

  constructor(private readonly appService: AppService) {
    this.logger = new Logger('CRON')
  }

  async onModuleInit() {
    try {
      const isAlive = await this.appService.lifeCheck()
      if (isAlive) {
        const heatingCron = new CronJob(CronExpression.EVERY_SECOND, () => {
          void this.progressHeating()
        })
        this.heatingCron = heatingCron

        const printingCron = new CronJob(CronExpression.EVERY_10_SECONDS, () => {
          void this.progressPrinting()
        })
        this.printingCron = printingCron

        const idleCron = new CronJob(CronExpression.EVERY_5_SECONDS, () => {
          void this.progressIdle()
        })
        this.IdleCron = idleCron

        const switchingFilamentCron = new CronJob(CronExpression.EVERY_SECOND, () => {
          void this.progressSwitchingFilament()
        })
        this.switchingFilamentCron = switchingFilamentCron

        const printingFinishedCron = new CronJob(CronExpression.EVERY_SECOND, () => {
          void this.progressPrintingFinished()
        })
        this.printingFinishedCron = printingFinishedCron

        void this.initiateTracking()
      }
    } catch (e) {
      this.logger.error(`Prusa or WLED is not ALIVE:  ${e?.response?.message || e?.message}`)
    }
  }

  async progressPrintingFinished() {
    this.logger.verbose('CronJob - Printing Finished')
    const printerState: IPrinterState = await this.appService.getPrinterState()
    const printerStatus = this.statusAndCronHAndler(printerState)
    if (printerStatus !== IPrinterStateEnum.PrintingFinished) return
    if (this.printTime) this.printTime = null
    await this.appService.updateWLED(UPDATE_WLED_TYPE.FINISHED)
  }

  async progressSwitchingFilament() {
    this.logger.verbose('CronJob - Switching Filament')
    const printerState: IPrinterState = await this.appService.getPrinterState()
    const printerStatus = this.statusAndCronHAndler(printerState)
    if (printerStatus !== IPrinterStateEnum.SwitchingFilament) return
    await this.appService.updateWLED(UPDATE_WLED_TYPE.SWITCHING_FILAMENT)
  }

  async progressIdle() {
    this.logger.verbose('CronJob - Idle')
    const printerState: IPrinterState = await this.appService.getPrinterState()
    const printerStatus = this.statusAndCronHAndler(printerState)
    if (printerStatus !== IPrinterStateEnum.Idle) return
    await this.appService.updateWLED(UPDATE_WLED_TYPE.IDLE)
  }

  async progressHeating() {
    this.logger.verbose('CronJob - Heating')
    const printerState: IPrinterState = await this.appService.getPrinterState()
    const printerStatus = this.statusAndCronHAndler(printerState)
    if (printerStatus !== IPrinterStateEnum.PrintingHeating) return
    const percentage = Math.round((printerState.printer.temp_nozzle * 100) / printerState.printer.target_nozzle)
    await this.appService.updateWLED(UPDATE_WLED_TYPE.HEATING, percentage)
  }

  //! Fn ENUM = PrintingPercentage
  async progressPrinting() {
    const printerState: IPrinterState = await this.appService.getPrinterState()
    const printerStatus = this.statusAndCronHAndler(printerState)
    const percentage = printerState.job.progress
    this.logger.verbose(`CronJob - Printing Progress, ${percentage}%`)
    if (printerStatus !== IPrinterStateEnum.PrintingPercentage) return
    await this.appService.updateWLED(UPDATE_WLED_TYPE.PRINTING, percentage)
    const remainingPrintTime = printerState.job.time_remaining
    const elapsedTime = printerState.job.time_printing
    if (remainingPrintTime < 10 * 60) {
      this.updateCronTime(this.printingCron, CronCustomExpressions.EVERY_5_SECONDS)
    } else if (remainingPrintTime + elapsedTime < (100 / LEDS) * 60) {
      //We Divide by LEDS to get the time for each LED
      this.updateCronTime(this.printingCron, CronCustomExpressions.EVERY_10_SECONDS)
    } else this.updateCronTime(this.printingCron, CronCustomExpressions.EVERY_5_SECONDS)
  }

  //! Initiate tracking responsible of getting the first data from Prusa, update wled and start crons
  async initiateTracking() {
    const initialState: IPrinterState = await this.appService.getPrinterState()
    this.statusAndCronHAndler(initialState)
  }
  statusAndCronHAndler(printerState: IPrinterState): IPrinterStateEnum {
    const { target_bed, temp_bed, target_nozzle, temp_nozzle } = printerState.printer
    const cronsMap: ICronsMap = {
      [PrusaLinkPrinterStates.PRINTING]: {
        condition: {
          check:
            (target_bed !== 0 && target_bed - temp_bed > 4) || (target_nozzle !== 0 && target_nozzle - temp_nozzle > 6),
          startCron: this.heatingCron,
          stopCrons: [this.printingCron, this.printingFinishedCron, this.IdleCron, this.switchingFilamentCron],
          stateToReturn: IPrinterStateEnum.PrintingHeating,
        },
        startCron: this.printingCron,
        stateToReturn: IPrinterStateEnum.PrintingPercentage,
        stopCrons: [this.heatingCron, this.printingFinishedCron, this.IdleCron, this.switchingFilamentCron],
      },
      [PrusaLinkPrinterStates.IDLE]: {
        startCron: this.IdleCron,
        stateToReturn: IPrinterStateEnum.Idle,
        stopCrons: [this.heatingCron, this.printingFinishedCron, this.printingCron, this.switchingFilamentCron],
      },
      [PrusaLinkPrinterStates.BUSY]: {
        condition: {
          check:
            (target_bed !== 0 && target_bed - temp_bed > 4) || (target_nozzle !== 0 && target_nozzle - temp_nozzle > 6),
          startCron: this.heatingCron,
          stopCrons: [this.printingCron, this.printingFinishedCron, this.IdleCron, this.switchingFilamentCron],
          stateToReturn: IPrinterStateEnum.PrintingHeating,
        },
        startCron: this.switchingFilamentCron,
        stopCrons: [this.heatingCron, this.printingFinishedCron, this.IdleCron, this.printingCron],
        stateToReturn: IPrinterStateEnum.SwitchingFilament,
      },
      [PrusaLinkPrinterStates.FINISHED]: {
        stopCrons: [this.switchingFilamentCron, this.heatingCron, this.IdleCron, this.printingCron],
        stateToReturn: IPrinterStateEnum.PrintingFinished,
        startCron: this.printingFinishedCron,
      },
      [PrusaLinkPrinterStates.ATTENTION]: {
        startCron: this.switchingFilamentCron,
        stateToReturn: IPrinterStateEnum.SwitchingFilament,
        stopCrons: [this.printingFinishedCron, this.heatingCron, this.IdleCron, this.printingCron],
      },
      defaultState: {
        startCron: this.IdleCron,
        stateToReturn: IPrinterStateEnum.Idle,
        stopCrons: [this.switchingFilamentCron, this.printingFinishedCron, this.heatingCron, this.printingCron],
      },
    }

    const state = cronsMap[printerState.printer.state] || cronsMap.defaultState

    if (state?.condition) {
      if (state.condition.check) {
        this.startAndStopCrons(state.condition.startCron, state.condition.stopCrons)
        return state.condition.stateToReturn
      }
    }
    this.startAndStopCrons(state.startCron, state.stopCrons)
    return state.stateToReturn
  }

  startAndStopCrons(startCron: CronJob, stopCrons: CronJob[]) {
    stopCrons.forEach((cronjob) => {
      if (cronjob.running) cronjob.stop()
    })
    if (!startCron.running) startCron.start()
  }

  updateCronTime(cronJob: CronJob, cronTime: string) {
    if (cronJob.cronTime.source !== cronTime) {
      this.logger.log(`Cron time updated from ${cronJob.cronTime.source} to ${cronTime}`)
      cronJob.setTime(new CronTime(cronTime))
    }
  }
}
