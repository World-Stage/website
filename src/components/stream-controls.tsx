"use client";

import { useState } from "react";
import { HandThumbUpIcon, HandThumbDownIcon } from "@heroicons/react/24/outline";

export function StreamControls() {
  const [hasVoted, setHasVoted] = useState(false);

  const handleVote = async (vote: "keep" | "skip") => {
    if (hasVoted) return;

    try {
      const response = await fetch('http://localhost:8082/stream/view/vote', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ voteType: vote }),
      });

      if (response.ok) {
        setHasVoted(true);
      }
    } catch (error) {
      console.error("Failed to submit vote:", error);
    }
  };

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      <button
        onClick={() => handleVote("keep")}
        disabled={hasVoted}
        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HandThumbUpIcon className="w-5 h-5" />
        Keep Going
      </button>
      <button
        onClick={() => handleVote("skip")}
        disabled={hasVoted}
        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <HandThumbDownIcon className="w-5 h-5" />
        Skip
      </button>
    </div>
  );
} 