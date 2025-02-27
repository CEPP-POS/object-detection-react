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
  let capturing = false;
  // Modify handleCancel to reset the waiting state
  const handleCancel = () => {
    capturing = false
    setCapturedImage(null);
    setWaitingForDecision(false);
  };

  // Modify handleAccept to reset the waiting state
  const handleAccept = () => {
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `phone-slip-${new Date().getTime()}.png`;
    link.click();
    setCapturedImage(null);
    setWaitingForDecision(false);
  };

  const [isDetecting, setIsDetecting] = useState(true);

  // // Modify handleCancel to re-enable detection
  // handleCancel = () => {
  //   setCapturedImage(null);
  //   setWaitingForDecision(false);
  //   setIsDetecting(true);
  // };

  // Modify detect function
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
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };
  // asasdasdasdsadsasadsad
  const startCountdown = () => {
    if (!isCountingDown && capturing === false) {
      setIsCountingDown(true);
      countdownRef.current = setTimeout(() => {
        capturing = true;
        captureImage();
        setIsCountingDown(false);
      }, 2000);
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
          <Webcam
            ref={webcamRef}
            muted={true}
            screenshotFormat="image/png"
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
          paddingLeft: "1000px",
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
