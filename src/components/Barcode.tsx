import React from 'react';

interface BarcodeProps {
  value: string;
}

export const Barcode: React.FC<BarcodeProps> = ({ value }) => {
  // A deterministic visual barcode generator mapping characters to line groupings.
  const getBars = (val: string) => {
    let result = '1010110'; // Start guard line
    const safeVal = val || 'APEX-001';
    for (let i = 0; i < safeVal.length; i++) {
      const code = safeVal.charCodeAt(i);
      const bin = (code % 16).toString(2).padStart(4, '0');
      for (const char of bin) {
        result += char === '0' ? '101' : '11001';
      }
    }
    result += '110101'; // Stop guard line
    return result;
  };

  const bars = getBars(value);
  const barWidth = 2.5;
  const barHeight = 45;
  const totalWidth = bars.length * barWidth;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width={totalWidth} height={barHeight} style={{ overflow: 'visible' }}>
        {bars.split('').map((char, idx) => {
          if (char === '1') {
            return (
              <rect
                key={idx}
                x={idx * barWidth}
                y={0}
                width={barWidth}
                height={barHeight}
                fill="#0F172A" // Slate 900
              />
            );
          }
          return null;
        })}
      </svg>
      <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0F172A', letterSpacing: '3px', fontWeight: 600 }}>
        {value || 'NO CODE'}
      </span>
    </div>
  );
};
export default Barcode;
