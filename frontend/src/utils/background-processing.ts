import '@mediapipe/selfie_segmentation';

const SelfieSegmentation =
  (window as any).SelfieSegmentation as {
    new (config: { locateFile: (file: string) => string }): any;
  };

export class BackgroundProcessor {
  private static instance: BackgroundProcessor;
  private segmentation: any = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private active = false;
  private animationFrameId: number | null = null;

  private constructor() {}

  public static getInstance(): BackgroundProcessor {
    if (!BackgroundProcessor.instance) {
      BackgroundProcessor.instance = new BackgroundProcessor();
    }
    return BackgroundProcessor.instance;
  }

  private async initModel() {
    if (this.segmentation) return;

    this.segmentation = new SelfieSegmentation({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });

    this.segmentation.setOptions({
      modelSelection: 1,
      selfieMode: false,
    });

    this.segmentation.onResults(this.onResults);
  }

  private onResults = (results: any) => {
    if (!this.ctx || !this.canvas) return;

    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.drawImage(
      results.segmentationMask,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    this.ctx.globalCompositeOperation = 'source-in';
    this.ctx.drawImage(
      results.image,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    this.ctx.globalCompositeOperation = 'destination-over';
    this.ctx.filter = 'blur(10px)';
    this.ctx.drawImage(
      results.image,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    this.ctx.restore();
    this.ctx.filter = 'none';
  };

  public async startProcessing(sourceStream: MediaStream): Promise<MediaStream> {
    await this.initModel();

    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
    }

    const video = document.createElement('video');
    video.srcObject = sourceStream;
    video.playsInline = true;
    video.muted = true;

    await new Promise((r) => {
      video.onloadedmetadata = () => {
        video.play();
        r(true);
      };
    });

    this.canvas.width = video.videoWidth;
    this.canvas.height = video.videoHeight;

    this.active = true;

    const loop = async () => {
      if (!this.active || !this.segmentation) return;
      await this.segmentation.send({ image: video });
      this.animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    const outStream = this.canvas.captureStream(30);
    const audioTrack = sourceStream.getAudioTracks()[0];
    if (audioTrack) outStream.addTrack(audioTrack);

    return outStream;
  }

  public stopProcessing() {
    this.active = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
