"use client";
import React, { useState, useEffect } from "react";
import io, { Socket } from "socket.io-client";

// Define the structure of a leaderboard entry
interface LeaderboardEntry {
  player: string; // Player's username
  cashOut: number | string | null; // Cash-out value, can be number, string or null
  amount: number | string | null; // Bet amount, can be number, string or null
  profit: number | string | null; // Profit, can be number, string or null
  country: string; // Country
  usdValue: number | string | null; // USD Value, can be number, string or null
}


// Initialize the socket variable with type
let socket: Socket;

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]); // State for leaderboard data

  useEffect(() => {
    // Establish a WebSocket connection
    socket = io("http://localhost:3076");

    // Listen for real-time leaderboard updates
    socket.on("updateLeaderboard", (data: LeaderboardEntry[]) => {
      setLeaderboard(data); // Update leaderboard with real-time data
    });

    // Cleanup the socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="w-full mx-auto p-[1.5rem] bg-[#323738] rounded-lg font-poppins">
      {/* Header for the leaderboard */}
      <div className="grid grid-cols-4 font-bold text-gray-400 text-center">
        <div className="text-left">Player</div>
        <div>Cash Out</div>
        <div>Amount</div>
        <div>Profit</div>
      </div>

      {/* Rendering leaderboard entries */}
      {leaderboard.map((row, index) => (
        <div
          key={index}
          style={{
            fontSize: "14px",
            lineHeight: "21px",
            fontWeight: 800,
          }}
          className="grid grid-cols-4 py-2 text-center text-gray-400 items-center"
        >
          <div style={{
            fontSize: "16px",
            lineHeight: "21px",
            fontWeight: 800,
            color: "#fff",
          }} className="font-extrabold whitespace-nowrap overflow-hidden text-ellipsis justify-center text-left max-w-xs">
            {row.player}
          </div>

          {/* Format cashOut and handle null or non-number values */}
          <div className="text-center">
          {row.country} {Number(row.cashOut).toFixed(2) || "0.00"}
          </div>

          {/* Format amount and handle null or non-number values */}
          <div className="flex flex-col justify-center text-white items-center">
            <span className="font-extrabold font-sans text-xs">
              {row.country} {Number(row.amount).toFixed(2) || "0.00"}{" "}
              {/* Format amount */}
            </span>
            <span className="text-[10px] font-normal font-sans w-5 text-right">
            ₹{Number(row.usdValue).toFixed(2) || "0.00"}{" "}
              {/* Format USD value */}
            </span>
          </div>

          {/* Format profit and handle null or non-number values */}
          <div>
          ₹{Number(row.profit).toFixed(2) || "0.00"} {/* Format profit */}
          </div>
        </div>
      ))}

      {/* Show More Button - Placeholder for future functionality */}
      <div className="text-center mt-5">
        <button  style={{
                fontSize: "14px",
                lineHeight: "21px",
                fontWeight: 900,
                color: '#fff'
              }} className="bg-gray-600 py-2 px-5 rounded-lg cursor-pointer">
          Show More
        </button>
      </div>
    </div>
  );
}