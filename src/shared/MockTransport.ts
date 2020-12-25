/* eslint-disable @typescript-eslint/no-explicit-any */
import Transport from "winston-transport";

export class MockTransport extends Transport {
  private callsValue: any[] = [];
  get calls(): any[] {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.callsValue;
  }

  constructor(opts: Transport.TransportStreamOptions) {
    super(opts);
  }

  reset(): void {
    this.callsValue = [];
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  log(info: any, next: () => void): void {
    this.callsValue.push(info);
    next();
  }
}
