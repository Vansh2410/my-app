// main section
"use client";
import React, { useState, useEffect } from "react";
import CrashStack from "./CrashStack";
import LineChart from "./Graph";
import Leaderboard from "./Leaderboard";
import BiddingSection from "./BiddingSection";
import { MdOutlineCasino } from "react-icons/md";
import { FaAngleDown } from "react-icons/fa";
import { RiMenuUnfoldFill } from "react-icons/ri";

const MainSection = ({ username }: { username?: string }) => {
  const [isExpanded, setIsExpanded] = useState(window.innerWidth >= 1024); // Expanded on large screens by default

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsExpanded(true); // Always expanded on large screens
      } else {
        setIsExpanded(false); // Collapsed on small and medium screens
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initialize state on component mount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle sidebar expansion only on small and medium screens
  const toggleExpand = () => {
    if (window.innerWidth < 1024) {
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="flex h-screen font-poppins">
      {/* Sidebar */}
      <div
        className={`${
          isExpanded ? "w-[250px]" : "w-[60px]"
        } h-full bg-[#292d2e] transition-all duration-300 ease-in-out flex-col items-start px-3 py-4 fixed z-30 shadow-lg
    ${
      isExpanded ? "hidden sm:flex md:w-[60px]" : "hidden sm:flex"
    } lg:w-[250px]`}
      >
        <button
          onClick={toggleExpand}
          className="bg-[#3d4344] hover:bg-[#4e5858] text-white rounded-lg p-2 mb-4 hidden md:block lg:hidden"
        >
          <RiMenuUnfoldFill className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center gap-2 w-full px-2 pt-4">
          <div
            className={`flex items-center ${
              isExpanded ? "justify-between" : "justify-center"
            } gap-2 bg-[#323738] hover:bg-[#3b4e47] text-sm rounded-lg w-full py-2 px-3 transition-all duration-300`}
          >
            <div className="flex items-center justify-center p-2 bg-[#464f50] rounded-lg">
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
        className={`transition-all duration-300 flex-1 flex flex-col bg-layer2 overflow-auto ${
          isExpanded ? "ml-[250px]" : "ml-0 sm:ml-[60px]"
        }`}
      >
        {/* Main Content Container */}
        <div className="flex-1 pt-10 px-4 md:px-12 pb-6">
          <div className="flex flex-col md:flex-row gap-4 w-full">
            {/* Left Section (Graph + Bidding Section) */}
            <div className="w-full md:w-[60%] flex flex-col pl-5 gap-4">
              <div className="bg-[#292d2e] rounded-xl pt-2">
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
            <div className="h-full md:w-[35%] ml-4 md:ml-0">
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
