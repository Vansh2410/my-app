// Revised code
import React, { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import "@fortawesome/fontawesome-free/css/all.min.css";

interface UserData {
  username: string;
  balance: number;
}

export default function BidderSection({ username }: { username: string }) {
  const [amount, setAmount] = useState(1);
  const [balance, setBalance] = useState(0);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [crashPoint, setCrashPoint] = useState(1);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isBetting, setIsBetting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState<"waiting" | "playing" | "crashed">(
    "waiting"
  );
  const [mode, setMode] = useState<"Manual" | "Auto">("Manual");
  const [autoMultiplier, setAutoMultiplier] = useState<number>(1.0);

  useEffect(() => {
    const newSocket = io("http://localhost:3076", {
      transports: ["websocket"],
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnecting(false);

      newSocket.emit(
        "validateUser",
        username,
        (response: {
          success: boolean;
          userData?: UserData;
          error?: string;
        }) => {
          if (response.success && response.userData) {
            setUserData(response.userData);
            setBalance(response.userData.balance);
          } else {
            setError(response.error || "Failed to validate user");
          }
        }
      );
    });

    newSocket.on("crash-update", (newCrashPoint: number) => {
      setCrashPoint(newCrashPoint);
      setMultiplier(newCrashPoint);
    });

    newSocket.on("bet-success", (betUsername: string, betAmount: number) => {
      if (betUsername === username) {
        setIsBetting(true);
        setBalance((prevBalance) => prevBalance - betAmount);
      }
    });

    newSocket.on(
      "gameState",
      (state: { status: string; currentMultiplier: number }) => {
        setGameState(state.status as "waiting" | "playing" | "crashed");
        if (state.status === "playing") {
          setMultiplier(state.currentMultiplier);
        } else if (state.status === "waiting" || state.status === "crashed") {
          setIsBetting(false);
        }
      }
    );

    newSocket.on("enableBetting", () => {
      setGameState("waiting");
      setIsBetting(false);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [username]);

  useEffect(() => {
    if (mode === "Auto" && gameState === "playing" && isBetting) {
      if (multiplier >= autoMultiplier) {
        handleCashout();
      }
    }
  }, [multiplier, autoMultiplier, mode, gameState, isBetting]);

  const handleNewBet = useCallback(() => {
    if (socket && userData && amount > 0 && balance >= amount) {
      setLoading(true);
      console.log("Placing bet: ", userData.username, amount);

      socket.emit(
        "newBet",
        userData.username,
        amount,
        (response: { success: boolean; error?: string }) => {
          setLoading(false);
          if (response.success) {
            console.log("Bet placed successfully");
            setIsBetting(true);
          } else {
            console.error("Bet failed: ", response.error);
            setError(response.error || "Failed to place bet");
          }
        }
      );
    } else {
      setError("Invalid bet or insufficient balance.");
    }
  }, [socket, userData, amount, balance]);

  const handleCashout = () => {
    if (socket && username && isBetting) {
      setLoading(true);
      let totalProfit = 0;
      const winpoint = Number(multiplier);
      const winamount = (amount * winpoint * 0.98).toFixed(2);
      const profit = parseFloat(winamount).toFixed(2);
      totalProfit += parseFloat(profit);

      console.log(username, amount, winpoint, winamount, totalProfit, balance);
      setBalance(totalProfit + balance);
      setIsBetting(false);
      setLoading(false);
      socket.emit("addWin", username, amount, winpoint, () => {
        setBalance(parseFloat(winamount));

        alert(`You cashed out at ${winpoint}x. Your winnings: $${winamount}`);
      });
    } else {
      alert("No active bet to cash out");
    }
  };

  if (isConnecting) {
    return (
      <div className="text-white text-center">Connecting to server...</div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full rounded-xl font-poppins">
      <div className="bg-[#323738] p-2 rounded-b-xl shadow-lg w-full">
        <div className="flex justify-evenly mb-2 pb-2 border-b border-green-500">
          <button
            style={{
              fontSize: "16px",
              lineHeight: "21px",
              fontWeight: 800,
              color: "#fff",
            }}
            onClick={() => setMode("Manual")}
            className={`mx-4 ${
              mode === "Manual" ? "text-white" : "text-gray-400"
            }`}
          >
            Manual
          </button>
          <button
            style={{
              fontSize: "16px",
              lineHeight: "21px",
              fontWeight: 800,
              color: "#fff",
            }}
            onClick={() => setMode("Auto")}
            className={`mx-4 ${
              mode === "Auto" ? "text-white" : "text-gray-400"
            }`}
          >
            Auto
          </button>
        </div>

        {mode === "Manual" ? (
          <>
            {/* Manual mode content */}
            <div className="text-white text-center mb-2">
              <div className="text-white text-center mb-2">
                {gameState === "waiting" && "Waiting for next game..."}
                {gameState === "playing" && "Game is in progress..."}
                {gameState === "crashed" && `Game crashed at ${crashPoint}x`}
              </div>

              {gameState === "playing" && isBetting ? (
                <button
                  onClick={handleCashout}
                  className="button button-brand button-m flex-1 w-full m-auto text-primary_brand font-[800] md:max-w-[400px] md:h-12 text-black rounded-xl glow-gradient"
                  disabled={loading}
                >
                  <span className="flex flex-col items-center justify-center leading-tight">
                    {loading ? (
                      "Processing..."
                    ) : (
                      <span>{`Cash Out at ${(Number(multiplier) || 1).toFixed(
                        2
                      )}x`}</span>
                    )}
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleNewBet}
                  className={`button button-brand button-m flex-1 w-full m-auto font-[800] md:max-w-[400px] md:h-12 text-black rounded-xl glow-gradient`}
                  disabled={
                    !userData ||
                    loading === true ||
                    isBetting === true ||
                    gameState !== "waiting"
                  }
                >
                  <span className="flex flex-col items-center justify-center leading-tight">
                    {loading ? (
                      "Betting..."
                    ) : (
                      <>
                        <span>Bet</span>
                    
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>

            <style jsx>{`
              .glow-gradient {
                background: linear-gradient(270deg, #88fc03, #a2f478);
                background-size: 200% 100%;
                transition: background-position 0.4s ease-in-out,
                  box-shadow 0.4s ease-in-out;
                box-shadow: 0 4px 15px rgba(136, 252, 3, 0.5);
              }

              .glow-gradient:hover {
                background-position: 100% 0;
                box-shadow: 0 4px 20px rgba(162, 244, 120, 0.7);
              }

              .glow-gradient:disabled {
                background: #3C9510FF;
                background-size: 100% 100%;
                box-shadow: none;
                cursor: not-allowed;
              }
            `}</style>

            <div className="flex justify-between items-center mb-3">
              <div className="flex-1 pr-4">
                <div className="text-gray-400 text-sm mb-2 flex justify-between">
                  <span
                    style={{
                      fontSize: "14px",
                      lineHeight: "20px",
                      fontWeight: 800,
                      color: "#b3bec1",
                    }}
                  >
                    Amount{" "}
                    <i className="fas fa-info-circle text-green-500 ml-1"></i>
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      lineHeight: "20px",
                      fontWeight: 600,
                      color: "#b3bec1",
                    }}
                  >
                    {" "}
                    ₹{balance.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center bg-[#292d2e] p-1 rounded-lg justify-between w-full">
                  <div className="flex items-center bg-[#292d2e] p-1 rounded-lg">
                    <i className="fa-solid fa-indian-rupee-sign fa-xs"></i>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) =>
                        setAmount(Math.max(1, parseFloat(e.target.value)))
                      }
                      style={{
                        fontSize: "14px",
                        height: "1.5rem",
                        lineHeight: "20px",
                        fontWeight: 800,
                      }}
                      className="bg-transparent text-white ml-2 w-20 text-left focus:outline-none"
                      min="0.01"
                      step="0.01"
                      placeholder="Multiplier"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      style={{
                        fontSize: "14px",
                        height: "2.5rem",
                        lineHeight: "12px",
                        fontWeight: 400,
                      }}
                      className="bg-[#3a4142] text-white px-3 p-2 rounded-lg hover:bg-gray-500"
                      onClick={() => setAmount(amount / 2)}
                    >
                      1/2
                    </button>
                    <button
                      style={{
                        fontSize: "14px",
                        height: "2.5rem",
                        lineHeight: "12px",
                        fontWeight: 400,
                      }}
                      className="bg-[#3a4142] text-white px-3 p-2 rounded-lg hover:bg-gray-500"
                      onClick={() => setAmount(amount * 2)}
                    >
                      2x
                    </button>
                    <div
                      style={{
                        fontSize: "10px",
                        lineHeight: "12px",
                        fontWeight: 800,
                        color: "#b3bec1",
                      }}
                      className="flex items-center space-x-2 bg-[#292d2e] rounded-lg"
                    >
                      <button
                        className="bg-[#3a4142] w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-500 font-bold"
                        onClick={() => setAmount(Math.max(0, amount - 1))}
                      >
                        <i className=" fas fa-chevron-left"></i>
                      </button>

                      <button
                        className="bg-[#3a4142] w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-500"
                        onClick={() => setAmount(amount + 1)}
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[1, 5, 10, 20].map((val) => (
                    <button
                      style={{
                        fontSize: "16px",
                        lineHeight: "18px",
                        fontWeight: 600,
                        color: "#b3bec1",
                      }}
                      key={val}
                      onClick={() => setAmount(val)}
                      className="bg-[#353b3c] text-white rounded-lg py-2 hover:bg-gray-500"
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /////Auto Section
          <>
            {/* Auto mode content */}
            <div className="text-white text-center mb-2">
              Auto Betting Mode Activated...
              <div className="text-white text-center mb-2">
                {gameState === "waiting" && "Waiting for next game..."}
                {gameState === "playing" && "Game is in progress..."}
                {gameState === "crashed" && `Game crashed at ${crashPoint}x`}
              </div>
              {gameState === "playing" && isBetting ? (
                <button
                  onClick={handleCashout}
                  style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    fontWeight: 800,
                    backgroundColor: "#fc0303",
                  }}
                  className="text-black font-bold px-3 py-2 rounded-xl w-1/2"
                  disabled={loading}
                >
                  {loading ? "Processing..." : `Cash Out at ${autoMultiplier}x`}
                </button>
              ) : (
                <button
                  onClick={handleNewBet}
                  style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    fontWeight: 900,
                    backgroundColor: "#88fc03",
                  }}
                  className={`text-black font-bold px-3 py-2 rounded-xl w-1/2 disabled:opacity-30 disabled:cursor-not-allowed`}
                  disabled={
                    !userData ||
                    loading == true ||
                    isBetting == true ||
                    (gameState !== "waiting" && gameState !== "crashed")
                  }
                >
                  {loading ? "Betting..." : "Bet"}
                </button>
              )}
            </div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex-1 pr-4">
                <div className="text-gray-400 text-sm mb-2 flex justify-between">
                  <span
                    style={{
                      fontSize: "14px",
                      height: "1.5rem",
                      lineHeight: "20px",
                      fontWeight: 800,
                    }}
                  >
                    Auto Cash Out{" "}
                    <i className="fas fa-info-circle text-green-500 ml-1"></i>
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      lineHeight: "20px",
                      fontWeight: 600,
                    }}
                  >
                    ₹{balance.toFixed(2)}
                  </span>
                </div>

                <div className="flex space-x-4">
                  {/* First Auto Multiplier Control */}
                  <div className="flex items-center bg-[#292d2e] p-1 rounded-lg justify-between w-1/2">
                    <div className="flex items-center bg-[#292d2e] p-1 rounded-lg">
                      <i className="fa-sharp fa-solid fa-xmark"></i>
                      <input
                        type="number"
                        value={autoMultiplier}
                        onChange={(e) => {
                          setAutoMultiplier(
                            Math.max(1, parseFloat(e.target.value))
                          );
                        }}
                        style={{
                          fontSize: "14px",
                          height: "1.5rem",
                          lineHeight: "20px",
                          fontWeight: 800,
                        }}
                        className="bg-transparent text-white ml-2 w-20 text-left focus:outline-none"
                        min="0.01"
                        step="0.01"
                        placeholder="Multiplier"
                      />
                    </div>

                    <div className="flex space-x-2">
                      <button
                        style={{
                          fontSize: "14px",
                          height: "2.5rem",
                          lineHeight: "12px",
                          fontWeight: 800,
                        }}
                        className="bg-[#3a4142] text-white px-3 p-2 rounded-lg hover:bg-gray-500"
                        onClick={() => setAutoMultiplier(autoMultiplier / 2)}
                      >
                        1/2
                      </button>
                      <button
                        style={{
                          fontSize: "14px",
                          height: "2.5rem",
                          lineHeight: "12px",
                          fontWeight: 800,
                        }}
                        className="bg-[#3a4142] text-white px-3 p-2 rounded-lg hover:bg-gray-500"
                        onClick={() => setAutoMultiplier(autoMultiplier * 2)}
                      >
                        2x
                      </button>
                      <div
                        style={{
                          fontSize: "10px",
                          lineHeight: "12px",
                          fontWeight: 800,
                        }}
                        className="flex flex-col items-center space-y-1"
                      >
                        <button
                          className="bg-[#3a4142] px-3 p-1 rounded-lg flex flex-col items-center hover:bg-gray-500"
                          onClick={() => setAutoMultiplier(autoMultiplier + 1)}
                        >
                          <i className="fas fa-chevron-up"></i>
                        </button>
                        <button
                          className="bg-[#3a4142] px-3 py-1 rounded-lg flex flex-col items-center hover:bg-gray-500"
                          onClick={() =>
                            setAutoMultiplier(Math.max(0, autoMultiplier - 1))
                          }
                        >
                          <i className="fas fa-chevron-down"></i>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Second Auto Multiplier Control */}

                  <div className="flex items-center bg-[#292d2e]  p-1 rounded-lg justify-between w-1/2">
                    <div className="flex items-center bg-[#292d2e]  p-1 rounded-lg">
                      <i className="fa-solid fa-indian-rupee-sign"></i>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => {
                          setAmount(Math.max(1, parseFloat(e.target.value)));
                        }}
                        style={{
                          fontSize: "14px",
                          height: "1.5rem",
                          lineHeight: "20px",
                          fontWeight: 800,
                        }}
                        className="bg-transparent text-white ml-2 w-20 text-left focus:outline-none"
                        min="0.01"
                        step="0.01"
                        placeholder="Amount"
                      />
                    </div>

                    <div
                      style={{
                        fontSize: "14px",
                        height: "2.5rem",
                        lineHeight: "12px",
                        fontWeight: 800,
                      }}
                      className="flex space-x-2"
                    >
                      <button
                        className="bg-[#3a4142] text-white px-3 p-2 rounded-lg hover:bg-gray-500"
                        onClick={() => setAmount(amount / 2)}
                      >
                        1/2
                      </button>
                      <button
                        className="bg-[#3a4142] text-white px-3 p-2 rounded-lg hover:bg-gray-500"
                        onClick={() => setAmount(amount * 2)}
                      >
                        2x
                      </button>
                      <div
                        style={{
                          fontSize: "10px",
                          lineHeight: "12px",
                          fontWeight: 800,
                        }}
                        className="flex flex-col items-center space-y-1"
                      >
                        <button
                          className="bg-[#3a4142] text-white px-3 p-1 rounded-lg flex flex-col items-center hover:bg-gray-500"
                          onClick={() => setAmount(amount + 1)}
                        >
                          <i className="fas fa-chevron-up"></i>
                        </button>
                        <button
                          className="bg-[#3a4142] text-white px-3 py-1 rounded-lg flex flex-col items-center hover:bg-gray-500"
                          onClick={() => setAmount(Math.max(0, amount - 1))}
                        >
                          <i className="fas fa-chevron-down"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* You can add more features for Auto mode here */}
          </>
        )}
      </div>
      {error && <div className="text-red-500 text-center">{error}</div>}
    </div>
  );
}
