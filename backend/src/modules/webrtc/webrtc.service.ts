// src/modules/webrtc/webrtc.service.ts
import { Injectable } from '@nestjs/common';
import { webrtcConfig } from '../../config/webrtc.config';

@Injectable()
export class WebRTCService {
  getIceServers() {
    return webrtcConfig.iceServers;
  }
}

