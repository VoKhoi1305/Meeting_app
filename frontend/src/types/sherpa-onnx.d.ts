declare module "sherpa-onnx" {
  export interface OnlineRecognizer {
    createStream(): any;
    isReady(stream: any): boolean;
    decode(stream: any): void;
    getResult(stream: any): { text: string };
    free(): void;
  }

  export function createOnlineRecognizer(config: any): OnlineRecognizer;
}
