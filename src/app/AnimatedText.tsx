'use client';

import React, { useMemo } from 'react';

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  /** Use "inline" so words flow horizontally; "block" stacks vertically (legacy). */
  display?: "inline" | "block";
}

export default function AnimatedText({ text, className = '', delay = 150, display = "inline" }: AnimatedTextProps) {
  const words = useMemo(() => text.split(' '), [text]);

  return (
    <h1 className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          className={`opacity-0 animate-fade-in-word ${display === "block" ? "block" : "inline-block mr-[0.25em]"}`}
          style={{ animationDelay: `${index * delay}ms` }}
        >
          {word}
        </span>
      ))}
    </h1>
  );
}
