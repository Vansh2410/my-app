"use client";

import React from "react";
import { useParams } from "next/navigation"; // For extracting dynamic route params in App Router
import MainSection from "@/components/MainSection";

export default function UserPage() {
  const { username } = useParams() as { username: string }; // Extracting 'username' from the dynamic route

  if (!username) {
    return <div>Error: Username is not defined</div>;
  }

  return (
    <div className="bg-[#232626]">
      {/* Pass the username directly to MainSection */}
      <MainSection username={username} />
    </div>
  );
}
