declare module '@mediapipe/selfie_segmentation' {
  export class SelfieSegmentation {
    constructor(config: { locateFile: (file: string) => string });
    setOptions(options: { modelSelection: number; selfieMode?: boolean }): void;
    onResults(callback: (results: any) => void): void;
    send(inputs: { image: HTMLVideoElement | HTMLCanvasElement }): Promise<void>;
    close(): Promise<void>;
  }
}