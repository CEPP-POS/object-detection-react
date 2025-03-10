// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";
import { drawRect } from "./utilities";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const countdownRef = useRef(null);

  const [isCountingDown, setIsCountingDown] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [waitingForDecision, setWaitingForDecision] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showWebcam, setShowWebcam] = useState(true);
  // Modify handleCancel to reset the waiting state
  const handleCancel = () => {
    setIsCapturing(false);
    setCapturedImage(null);
    setWaitingForDecision(false);
    setIsCountingDown(false);
    setIsDetecting(true);
    setShowWebcam(true);
  };

  // Modify handleAccept to reset the waiting state
  const handleAccept = () => {
    // Stop camera stream
    if (webcamRef.current && webcamRef.current.video) {
      const stream = webcamRef.current.video.srcObject;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `phone-slip-${new Date().getTime()}.png`;
    link.click();
    setCapturedImage(null);
    setWaitingForDecision(false);
  };

  const [isDetecting, setIsDetecting] = useState(true);


  const detect = async (net) => {
    if (!isDetecting) {
      return;
    }

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make Detections
      const obj = await net.detect(video);
      const cellPhoneDetections = obj.filter(detection => detection.class === 'cell phone');
      // ตีกรอบ detect เจอ
      if (cellPhoneDetections.length > 0) {
        setIsDetecting(false);
        startCountdown();
        setWaitingForDecision(true);
      }

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");
      drawRect(cellPhoneDetections, ctx);
    }
  };

  const captureImage = () => {
    // Clear the canvas before capturing
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
      setShowWebcam(false);
    }
  };

  const startCountdown = () => {
    if (!isCountingDown && !isCapturing) {
      setIsCountingDown(true);
      countdownRef.current = setTimeout(() => {
        setIsCapturing(true);
        captureImage();
        setIsCountingDown(false);
      }, 1000);
    }
  };

  useEffect(() => {
    const runCoco = async () => {
      const net = await cocossd.load();
      setInterval(() => {
        detect(net);
      }, 10);
    };
    runCoco();
  }, []);

  return (
    <div className="App" style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
      <div className="camera-section">
        <header className="App-header">
          {showWebcam && (
            <Webcam
              ref={webcamRef}
              muted={true}
              screenshotFormat="image/png"
              videoConstraints={{
                frameRate: 12,
              }}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zindex: 9,
                width: 640,
                height: 480,
              }}
            />
          )}
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zindex: 8,
              width: 640,
              height: 480,
            }}
          />
        </header>
      </div>

      {capturedImage && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <img
            src={capturedImage}
            alt="Captured phone"
            style={{
              width: "640px",
              height: "480px",
              objectFit: "contain",
            }}
          />
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={handleAccept}
              style={{
                margin: "0 10px",
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Accept
            </button>
            <button
              onClick={handleCancel}
              style={{
                margin: "0 10px",
                padding: "10px 20px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
