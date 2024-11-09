"use client";
import React, { useState } from "react";
import CrashStack from "./CrashStack";
import LineChart from "./Graph";
import Leaderboard from "./Leaderboard";
import BiddingSection from "./BiddingSection";
import { MdOutlineCasino } from "react-icons/md";
import { FaAngleDown } from "react-icons/fa";
import { RiMenuUnfoldFill } from "react-icons/ri";

const MainSection = ({ username }: { username?: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to toggle the sidebar expansion
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex h-screen font-poppins">
      {/* Left Sidebar - Hidden on small screens and visible on medium and up */}
      <div
        className={`${
          isExpanded ? "w-[250px]" : "w-[60px]"
        } h-full bg-[#292d2e] transition-all duration-300 ease-in-out hidden  flex-col items-start px-3 py-4 fixed z-30 shadow-lg sm:hidden md:flex`}
       >
        <button
          onClick={toggleExpand}
          className="bg-[#3d4344] hover:bg-[#4e5858] text-white rounded-lg p-2 mb-4"
        >
          <RiMenuUnfoldFill className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center gap-2 w-full px-2 pt-4">
          <div
            className={`flex items-center ${
              isExpanded
                ? "justify-between"
                : "justify-center items-center w-10 h-10"
            } gap-2 bg-[#323738] hover:bg-[#3b4e47] text-sm rounded-lg w-full py-2 px-3 transition-all duration-300`}
          >
            <div
              className={`flex items-center justify-center p-2 bg-[#464f50] rounded-lg ${
                isExpanded ? "w-auto" : "w-12 h-12 bg-transparent"
              }`}
            >
              <MdOutlineCasino className="text-white" />
            </div>

            {isExpanded && <span className="text-white">Casino</span>}

            {isExpanded && (
              <button className="flex items-center justify-end bg-[#464f50] p-1 rounded-lg">
                <FaAngleDown className="text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 flex-1 flex flex-col bg-layer2 overflow-auto` }
        // need to work here for responisveness as this is causing margin errors in large screen of colission
        style={{
          marginLeft: isExpanded ? "250px" : "0px",
        }}
      >
        {/* Main Content Container */}
        <div className="flex-1 pt-20 px-4 md:px-12 pb-6">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Left Section (Graph + Bidding Section) */}
            <div className="w-full md:w-[60%] flex flex-col pl-5 gap-4">
              <div className="bg-[#1f1e1e] rounded-xl pt-2">
                <div className="flex justify-between items-center gap-4 mb-4">
                  <CrashStack />
                </div>

                <LineChart />

                <div className="mt-1">
                  <BiddingSection username={username || ""} />
                </div>
              </div>
            </div>

            {/* Right Section (Leaderboard) */}
            {/* On medium screens and up, show side by side. On smaller screens, move below the graph */}
            <div className="h-full md:w-[35%]">
              <div className="bg-[#232626] rounded-xl">
                <Leaderboard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainSection;