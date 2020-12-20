import Transport from 'winston-transport';
export default class MockTransport extends Transport {
    private callsValue;
    get calls(): any[];
    constructor(opts: Transport.TransportStreamOptions);
    reset(): void;
    log(info: any, next: () => void): void;
}
//# sourceMappingURL=MockTransport.d.ts.map