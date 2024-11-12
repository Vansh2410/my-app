// leaderboard
"use client";
import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";

// Define the structure of a leaderboard entry
interface LeaderboardEntry {
  player: string;
  cashOut: number | string | null;
  amount: number | string | null;
  profit: number | string | null;
  country: string;
  usdValue: number | string | null;
}

// Initialize the socket variable with type
let socket: Socket;

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    // Establish a WebSocket connection
    socket = io("http://localhost:3076");

    // Listen for real-time leaderboard updates
    socket.on("updateLeaderboard", (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
    });

    // Cleanup the socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="w-full mx-auto p-4 bg-[#323738] rounded-lg font-poppins ">
      {/* Header for the leaderboard */}
      <div className="grid grid-cols-4 font-semibold text-gray-400 text-center text-sm mb-11">
        <div className="text-left pl-2">Player</div>
        <div>Cash Out</div>
        <div>Amount</div>
        <div>Profit</div>
      </div>

      {/* Rendering leaderboard entries */}
      {leaderboard.map((row, index) => (
        <div
          key={index}
          className="grid grid-cols-4 py-2 text-gray-300 items-center text-sm"
        >
          <div
            className="font-bold text-white text-left truncate"
            style={{ fontSize: "15px" }}
          >
            {row.player}
          </div>

          <div className="text-center">
            {row.country} {Number(row.cashOut || 0).toFixed(2)}
          </div>

          <div className="flex flex-col text-center">
            <span className="font-semibold text-white text-sm">
              {row.country} {Number(row.amount || 0).toFixed(2)}
            </span>
            <span className="text-xs font-normal text-gray-400">
              ₹{Number(row.usdValue || 0).toFixed(2)}
            </span>
          </div>

          <div className="text-center font-semibold text-green-400">
            ₹{Number(row.profit || 0).toFixed(2)}
          </div>
        </div>
      ))}

      {/* Show More Button */}
      <div className="text-center mt-4">
        <button
          className="bg-gray-600 py-2 px-5 rounded-lg text-white font-semibold hover:bg-gray-500 transition duration-150"
          style={{ fontSize: "14px" }}
        >
          Show More
        </button>
      </div>
    </div>
  );
}
