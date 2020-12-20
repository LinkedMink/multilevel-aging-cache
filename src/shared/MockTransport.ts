import Transport from 'winston-transport'

export default class MockTransport extends Transport {
  private callsValue: any[] = []
  get calls() {
    return this.callsValue;
  }

  constructor(opts: Transport.TransportStreamOptions) {
    super(opts);
  }

  reset() {
    this.callsValue = []
  }

  log(info: any, next: () => void) {
    this.callsValue.push(info)
    next();
  }
};
