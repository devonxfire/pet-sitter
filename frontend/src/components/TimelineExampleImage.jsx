import React from 'react';
import timelineExample from '/timeline-example.png';

export default function TimelineExampleImage() {
  return (
    <div className="w-full h-auto flex items-center justify-center">
      <img
        src={timelineExample}
        alt="Example Activity Timeline"
        className="rounded-xl border border-gray-200 shadow-sm max-w-full h-auto transform transition-transform duration-200 ease-out hover:scale-105"
        style={{ background: '#f7f8fa' }}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
