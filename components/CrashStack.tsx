// "use client";
// import React, { useState, useEffect, useRef } from "react";
// import io, { Socket } from "socket.io-client";
// import { BsFillCircleFill } from "react-icons/bs";
// import { motion } from "framer-motion";

// interface CrashEntry {
//   id: number;
//   crashpoint: number;
// }

// const CrashStack = () => {
//   const [queueElements, setQueueElements] = useState<CrashEntry[]>([]);
//   const socketRef = useRef<Socket | null>(null); // Store the socket reference
//   const MAX_QUEUE_SIZE = 10; // Maximum size for crash entries

//   useEffect(() => {
//     if (!socketRef.current) {
//       socketRef.current = io("http://localhost:3076");

//       // Listen for real-time crash stack updates
//       socketRef.current.on("showCrashStack", (data: CrashEntry[]) => {
//         setQueueElements(() => {
//           return data.slice(0, MAX_QUEUE_SIZE); // Replace the old queue with new limited data
//         });
//       });

//       // Listen for new crash values emitted by the CrashGame
//       socketRef.current.on("newCrashValue", (newCrashValue: number) => {
//         setQueueElements((prevQueue) => {
//           const newEntry: CrashEntry = {
//             id: prevQueue.length ? prevQueue[prevQueue.length - 1].id + 1 : 1, // Increment id for new entry
//             crashpoint: newCrashValue,
//           };

//           const updatedQueue = [...prevQueue, newEntry]; // Add the new entry to the end

//           // Limit the queue size
//           if (updatedQueue.length > MAX_QUEUE_SIZE) {
//             updatedQueue.shift(); // Remove the first element if size exceeds limit
//           }

//           return updatedQueue; // Return the updated queue
//         });
//       });
//     }

//     // Set up an interval to fetch data every second
//     const intervalId = setInterval(() => {
//       if (socketRef.current) {
//         socketRef.current.emit("requestCrashStack"); // Emit an event to request data
//       }
//     }, 2000); // Fetch data every second

//     // Cleanup the socket and interval on component unmount
//     return () => {
//       if (socketRef.current) {
//         socketRef.current.off("showCrashStack"); // Clean up event listener
//         socketRef.current.disconnect(); // Disconnect the socket
//         socketRef.current = null; // Set socket to null to prevent leaks
//       }
//       clearInterval(intervalId); // Clear the interval
//     };
//   }, []);

//   // Function to return Tailwind text color based on the crashpoint value
//   const getTextColor = (value: number) => {
//     return value > 5 ? "#fce305" : value > 2 ? "#49ff20" : "#ff9720";
//   };

//   return (
//     <div className="flex flex-row justify-evenly w-full bg-[#3a4142] h-10 overflow-hidden items-center rounded-md gap-2">
//       {queueElements
//         .slice() // Create a shallow copy of the array
//         .reverse() // Reverse the array to show the latest entry on the right
//         .map((item) => (
//           <motion.div
//             key={item.id}
//             initial={{ x: 100, opacity: 0 }} // Start from the right and hidden
//             animate={{ x: 0, opacity: 1 }} // Animate to the original position and fully visible
//             exit={{ x: -100, opacity: 0 }} // Slide out to the left when removed
//             transition={{ type: "spring", stiffness: 300, damping: 30 }} // Smooth transition
//             className="text-xs leading-tight text-left text-tertiary items-center whitespace-nowrap font-semibold"
//           >
//             <div className="flex items-center space-x-1">
//               <BsFillCircleFill
//                 className={`${getTextColor(item.crashpoint)}`}
//               />
//               <span className="text-slate-400">{item.id}</span>
//             </div>
//             <div
//               className={`text-sm leading-tight whitespace-nowrap font-extrabold text-brand ${getTextColor(
//                 item.crashpoint
//               )} ml-4`}
//             >
//               {item.crashpoint}X
//             </div>
//           </motion.div>
//         ))}
//     </div>
//   );
// };

// export default CrashStack; 


"use client";
import React, { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { BsFillCircleFill } from "react-icons/bs";
import { motion } from "framer-motion";

interface CrashEntry {
  id: number;
  crashpoint: number;
}

const CrashStack = () => {
  const [queueElements, setQueueElements] = useState<CrashEntry[]>([]);
  const socketRef = useRef<Socket | null>(null); // Store the socket reference
  const MAX_QUEUE_SIZE = 10; // Maximum size for crash entries

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io("http://localhost:3076");

      // Listen for real-time crash stack updates
      socketRef.current.on("showCrashStack", (data: CrashEntry[]) => {
        setQueueElements(() => data.slice(0, MAX_QUEUE_SIZE)); // Limit data size
      });

      // Listen for new crash values emitted by the CrashGame
      socketRef.current.on("newCrashValue", (newCrashValue: number) => {
        setQueueElements((prevQueue) => {
          const newEntry: CrashEntry = {
            id: prevQueue.length ? prevQueue[prevQueue.length - 1].id + 1 : 1, // Increment id for new entry
            crashpoint: newCrashValue,
          };
          const updatedQueue = [...prevQueue, newEntry];
          if (updatedQueue.length > MAX_QUEUE_SIZE) updatedQueue.shift();
          return updatedQueue;
        });
      });
    }

    // Request data at intervals
    const intervalId = setInterval(() => {
      socketRef.current?.emit("requestCrashStack");
    }, 2000);

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
      clearInterval(intervalId);
    };
  }, []);

  const getTextColor = (value: number) => {
    return value > 5 ? "#fce305" : value > 2 ? "#49ff20" : "#ff9720";
  };

  // Conditionally display only the last 5 entries on small screens
  const displayedElements =
    typeof window !== "undefined" && window.innerWidth < 640
      ? queueElements.slice(-5) // Show only last 5 items on small screens
      : queueElements;

  return (
    <div className="flex flex-row justify-evenly w-full bg-[#2b2b2b] ml-2 mr-2 h-10 overflow-hidden items-center rounded-md gap-2 font-poppins">
      {displayedElements
      .slice()
      .reverse()
      .map((item) => (
        <motion.div
        key={item.id}
        initial={{ x: 100, opacity: 0 }} // New value starts from the right
        animate={{ x: 0, opacity: 1 }}   // Value moves into place
        exit={{ x: -100, opacity: 0 }}   // If removed, it exits to the left
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
        className="text-xs leading-tight text-left text-tertiary items-center whitespace-nowrap font-semibold"
      >
        <div className="flex items-center space-x-1">
          <BsFillCircleFill
            style={{
              fontWeight: 800,
              fontSize: "12px",
              marginTop: "3px",
              color: getTextColor(item.crashpoint),
            }}
          />
          <span
            style={{
              fontSize: "12px",
              lineHeight: "15px",
              fontWeight: 600,
              color: "#849194",
            }}
            className="text-slate"
          >
            {item.id}
          </span>
        </div>
        <div
          style={{
            fontSize: "14px",
            lineHeight: "18px",
            fontWeight: 900,
            color: getTextColor(item.crashpoint),
          }}
          className="leading-tight whitespace-nowrap text-brand ml-4"
        >
          {item.crashpoint}
          <i
            style={{
              fontSize: "10px",
              lineHeight: "3px",
              fontWeight: 900,
            }}
            className="fa-sharp fa-solid fa-xmark fa-xm"
          ></i>
        </div>
      </motion.div>
      
      ))}
    </div>
  );
};

export default CrashStack;