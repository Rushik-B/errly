import React from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeColor?: string;
  strokeWidth?: number;
  className?: string;
}

const Sparkline: React.FC<SparklineProps> = ({
  data = [],
  width = 100,
  height = 20,
  strokeColor = '#60a5fa', // Tailwind blue-400
  strokeWidth = 1.5,
  className = '',
}) => {
  if (!data || data.length < 2) {
    // Need at least two points to draw a line
    return <div className={`inline-block ${className}`} style={{ width, height, border: '1px dashed #4b5563' }} title="Not enough data"></div>;
  }

  const maxX = data.length - 1;
  const maxY = Math.max(...data);
  const minY = Math.min(...data);
  const rangeY = maxY - minY;

  // Handle case where all data points are the same (avoid division by zero)
  const verticalScale = rangeY === 0 ? 1 : height / rangeY;
  const horizontalScale = width / maxX;

  const points = data
    .map((value, index) => {
      const x = index * horizontalScale;
      // Invert Y because SVG origin is top-left
      const y = height - ((value - minY) * verticalScale);
      // Clamp Y to prevent line going slightly out of bounds due to floating point math
      const clampedY = Math.max(strokeWidth / 2, Math.min(height - strokeWidth / 2, y)); 
      return `${x.toFixed(2)},${clampedY.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      className={`inline-block ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Sparkline chart showing values ${data.join(', ')}`}
      role="img"
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Sparkline; 