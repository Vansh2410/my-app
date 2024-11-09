import React, { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

export default function Component() {
  const [gameState, setGameState] = useState("waiting");
  const [dataPoints, setDataPoints] = useState([1]);
  const [timePoints, setTimePoints] = useState([0]);
  const [countdown, setCountdown] = useState(0);
  const [crashPoint, setCrashPoint] = useState(1);
  const [currentMultiplier, setCurrentMultiplier] = useState("1.00");
  const multiplierRef = useRef<number>(parseFloat(currentMultiplier));
  const startTime = useRef(Date.now());
  const socket = useRef<ReturnType<typeof io> | null>(null);
  const gameInterval = useRef<NodeJS.Timeout | null>(null);
  const [, setIsBetting] = useState(false);

  // Initialize localStorage and multiplier once the component is mounted
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("currentMultiplier")) {
      const storedMultiplier = localStorage.getItem("currentMultiplier");
      setCurrentMultiplier(storedMultiplier || "1.00");
      multiplierRef.current = parseFloat(storedMultiplier || "1.00");
    }
  }, []);

  const updateGraph = useCallback(() => {
    const elapsed = (Date.now() - startTime.current) / 1000;
    setTimePoints((prev) => [...prev, elapsed]);
    setDataPoints((prev) => [...prev, multiplierRef.current]);
    const formattedMultiplier = parseFloat(multiplierRef.current.toFixed(2)).toString();
    setCurrentMultiplier(formattedMultiplier);
    if (typeof window !== "undefined") {
      localStorage.setItem("currentMultiplier", formattedMultiplier); // Store the multiplier
    }
  }, []);

  const startGame = useCallback(() => {
    setGameState("playing");
    startTime.current = Date.now();
    setDataPoints([1]);
    setTimePoints([0]);
    setIsBetting(true);

    if (gameInterval.current) {
      clearInterval(gameInterval.current);
    }

    gameInterval.current = setInterval(() => {
      updateGraph();
    }, 50);
  }, [updateGraph]);

  const resetGame = useCallback(() => {
    setCountdown(0);
    setDataPoints([1]);
    setTimePoints([0]);
    setCrashPoint(1);
    multiplierRef.current = 1;
    setGameState("waiting");
    setIsBetting(false);

    if (gameInterval.current) {
      clearInterval(gameInterval.current);
    }
  }, []);

  const startCountdown = useCallback(() => {
    let count = 5;
    setCountdown(count);

    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdown(count);

      if (count === 0) {
        clearInterval(countdownInterval);
        startGame();
      }
    }, 1000);
  }, [startGame]);

  useEffect(() => {
    const newSocket = io("http://localhost:3076", {
      transports: ["websocket"],
      withCredentials: true,
    });

    socket.current = newSocket;

    newSocket.on("gameState", (state) => {
      if (state.status === "playing") {
        setGameState("playing");
        multiplierRef.current = parseFloat(state.currentMultiplier) || 1;
        startTime.current = Date.now();

        setDataPoints([multiplierRef.current]);
        setTimePoints([0]);
        const formattedMultiplier = multiplierRef.current.toFixed(2);
        setCurrentMultiplier(formattedMultiplier);
        if (typeof window !== "undefined") {
          localStorage.setItem("currentMultiplier", formattedMultiplier);
        }

        if (gameInterval.current) clearInterval(gameInterval.current);
        gameInterval.current = setInterval(() => {
          updateGraph();
        }, 50);
      } else {
        setGameState("waiting");
        startCountdown();
      }
    });

    newSocket.on("crash-update", (newCrashPoint) => {
      multiplierRef.current = parseFloat(newCrashPoint) || multiplierRef.current;
      updateGraph();
    });

    newSocket.on("updatehistory", (finalMultiplier) => {
      setGameState("crashed");
      setCrashPoint(parseFloat(finalMultiplier) || crashPoint);
      multiplierRef.current = parseFloat(finalMultiplier) || multiplierRef.current;
      if (gameInterval.current) {
        clearInterval(gameInterval.current);
      }
      updateGraph();
    });

    newSocket.on("reset", () => {
      resetGame();
    });

    return () => {
      if (gameInterval.current) {
        clearInterval(gameInterval.current);
      }
      newSocket.disconnect();
    };
  }, [resetGame, updateGraph, startCountdown]);

  const data = {
    labels: timePoints,
    datasets: [
      {
        label: "",
        data: dataPoints,
        borderColor: "#24ee89",
        borderWidth: 5,
        pointRadius: (context: { dataIndex: number }) => {
          const index = context.dataIndex;
          return index === dataPoints.length - 1 ? 6 : 0;
        },
        pointBackgroundColor: (context: { dataIndex: number }) => {
          const index = context.dataIndex;
          return index === dataPoints.length - 1
            ? "rgb(68, 207, 137)"
            : "transparent";
        },
        fill: true,
        backgroundColor: (context: { chart: { ctx: CanvasRenderingContext2D } }) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(213, 221, 232, 70);
          gradient.addColorStop(0, "rgb(213, 221, 232, 0.2)");
          gradient.addColorStop(1, "rgb(68, 207, 137,0.4)");
          return gradient;
        },
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: {
        type: "linear",
        position: "bottom",
        min: 0,
        max: timePoints.length > 0 ? Math.max(...timePoints) + 1 : 1,
        title: { display: true, text: "Time (s)" },
        ticks: {
          callback: (value) => `${Number(value).toFixed(1)}s`,
        },
        grid: { display: false },
      },
      y: {
        type: "linear",
        position: "left",
        min: 1,
        max: Math.ceil(multiplierRef.current) + 1,
        title: { display: true, text: "Multiplier (x)" },
        ticks: {
          callback: (value) => `${Number(value).toFixed(1)}x`,
        },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="relative w-full h-[300px] sm:h-[300px] md:h-[330px] bg-[#1f1e1e] rounded-lg overflow-hidden font-poppins">
      <div className="absolute inset-0">
        <Line data={data} options={options} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center mb-4">
        {gameState === "playing" && (
          <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white-400">
            {parseFloat(multiplierRef.current.toFixed(2))}
            <i
              style={{
                fontSize: "36px",
                lineHeight: "30px",
                fontWeight: 900,
              }}
              className="fa-sharp fa-solid fa-xmark fa-xl"
            ></i>
          </div>
        )}
        {gameState === "crashed" && (
          <div className="text-red-500 text-3xl sm:text-5xl md:text-6xl font-bold animate-pulse">
            CRASHED AT {crashPoint.toFixed(2)}
            <i className="fa-sharp fa-solid fa-xmark"></i>
          </div>
        )}
        {gameState === "waiting" && (
          <div className="text-white text-3xl sm:text-2xl md:text-4xl font-extrabold animate-pulse">
            Next round in {countdown}s
          </div>
        )}
      </div>
    </div>
  );
}