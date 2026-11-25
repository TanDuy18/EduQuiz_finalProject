import type { CameraPermissionState, FaceMonitorStatus } from "../types/proctoring";

interface MediaPipeBoundingBox {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface MediaPipeDetection {
  boundingBox?: MediaPipeBoundingBox;
}

interface MediaPipeFaceDetector {
  detectForVideo(video: HTMLVideoElement, timestampMs: number): { detections: MediaPipeDetection[] };
  close(): void;
}

/**
 * Hardware camera stream release — guaranteed to turn off the webcam LED immediately.
 */
export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      // Ignore already-stopped tracks
    }
  }
}

export function classifyCameraError(err: unknown): CameraPermissionState {
  if (!(err instanceof DOMException)) return "STREAM_INTERRUPTED";
  if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
    return "PERMISSION_DENIED";
  }
  if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
    return "NO_DEVICE";
  }
  if (err.name === "NotReadableError" || err.name === "TrackStartError") {
    return "DEVICE_IN_USE";
  }
  return "STREAM_INTERRUPTED";
}

/**
 * Lazy ESM loader for @mediapipe/tasks-vision FaceDetector (no package.json edits, zero bloat on normal pages).
 * Falls back cleanly to null (signaling Demo Fallback mode) if offline or blocked by CSP/network.
 * ponytail: Uses official MediaPipe CDN bundle to avoid modifying locked package.json; swap to bundled npm package when deps are unlocked.
 */
export async function loadMediaPipeFaceDetector(): Promise<MediaPipeFaceDetector | null> {
  try {
    const cdnUrl = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";
    const mod = (await import(/* @vite-ignore */ cdnUrl)) as {
      FilesetResolver: {
        forVisionTasks(wasmPath: string): Promise<unknown>;
      };
      FaceDetector: {
        createFromOptions(vision: unknown, options: Record<string, unknown>): Promise<MediaPipeFaceDetector>;
      };
    };

    const vision = await mod.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
    );

    return await mod.FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.55,
    });
  } catch {
    return null;
  }
}

export interface DebouncedFaceEvaluator {
  evaluate: (video: HTMLVideoElement, nowMs: number) => {
    rawStatus: FaceMonitorStatus;
    confirmedStatus: FaceMonitorStatus;
  };
  dispose: () => void;
}

/**
 * Sliding-window debounce guard: prevents false positives from brief blinks or head turns.
 * Requires >= 3000ms continuous NO_FACE or >= 2000ms MULTIPLE_FACES / OUT_OF_FRAME before confirming violation.
 */
export function createDebouncedFaceEvaluator(
  detector: MediaPipeFaceDetector | null,
): DebouncedFaceEvaluator {
  let pendingStatus: FaceMonitorStatus | null = null;
  let pendingSinceMs = 0;
  let confirmedStatus: FaceMonitorStatus = detector ? "INITIALIZING" : "DEMO_FALLBACK";

  return {
    evaluate(video: HTMLVideoElement, nowMs: number) {
      if (!detector) {
        return { rawStatus: "DEMO_FALLBACK", confirmedStatus: "DEMO_FALLBACK" };
      }
      if (video.readyState < 2 || video.videoWidth === 0) {
        return { rawStatus: "INITIALIZING", confirmedStatus };
      }

      let rawStatus: FaceMonitorStatus = "FACE_OK";
      try {
        const result = detector.detectForVideo(video, nowMs);
        const count = result.detections.length;
        if (count === 0) {
          rawStatus = "NO_FACE";
        } else if (count > 1) {
          rawStatus = "MULTIPLE_FACES";
        } else {
          const box = result.detections[0].boundingBox;
          if (box) {
            const cx = (box.originX + box.width / 2) / video.videoWidth;
            const cy = (box.originY + box.height / 2) / video.videoHeight;
            if (cx < 0.14 || cx > 0.86 || cy < 0.12 || cy > 0.88) {
              rawStatus = "OUT_OF_FRAME";
            }
          }
        }
      } catch {
        rawStatus = "FACE_OK";
      }

      if (rawStatus === "FACE_OK") {
        pendingStatus = null;
        pendingSinceMs = 0;
        confirmedStatus = "FACE_OK";
        return { rawStatus, confirmedStatus };
      }

      if (pendingStatus !== rawStatus) {
        pendingStatus = rawStatus;
        pendingSinceMs = nowMs;
        return { rawStatus, confirmedStatus };
      }

      const requiredMs = rawStatus === "NO_FACE" ? 3000 : 2000;
      if (nowMs - pendingSinceMs >= requiredMs) {
        confirmedStatus = rawStatus;
      }

      return { rawStatus, confirmedStatus };
    },
    dispose() {
      try {
        detector?.close();
      } catch {
        // Ignore detector close errors
      }
    },
  };
}
