/**
 * BarChart component — vanilla JS Canvas bar chart for category spending totals.
 * No external charting library used.
 *
 * @param {{ data: Array<{category: string, total: number}> }} props
 *   data — array of category totals to render as horizontal bars.
 */
import { useEffect, useRef } from 'react';

const BAR_HEIGHT = 32;
const BAR_GAP = 12;
const LABEL_WIDTH = 120;
const PADDING = 20;

export default function BarChart({ data }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;
    const ctx = canvas.getContext('2d');

    // Only show expense categories (negative totals) or all if mixed
    const filtered = data.filter((d) => d.total !== 0);
    const maxAbs = Math.max(...filtered.map((d) => Math.abs(d.total)), 1);

    const height = filtered.length * (BAR_HEIGHT + BAR_GAP) + PADDING * 2;
    canvas.height = height;
    const width = canvas.offsetWidth || 600;
    canvas.width = width;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, width, height);

    const barAreaWidth = width - LABEL_WIDTH - PADDING * 2;

    filtered.forEach((item, i) => {
      const y = PADDING + i * (BAR_HEIGHT + BAR_GAP);
      const barW = (Math.abs(item.total) / maxAbs) * barAreaWidth;

      // Label
      ctx.fillStyle = '#1f2328';
      ctx.font = '13px -apple-system, Segoe UI, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.category, PADDING, y + BAR_HEIGHT / 2);

      // Bar
      ctx.fillStyle = item.total >= 0 ? '#3b82d4' : '#e05252';
      ctx.beginPath();
      ctx.roundRect(LABEL_WIDTH + PADDING, y, barW, BAR_HEIGHT, 4);
      ctx.fill();

      // Value label
      ctx.fillStyle = '#57606a';
      ctx.font = '12px -apple-system, Segoe UI, sans-serif';
      ctx.fillText(
        `€${item.total.toFixed(2)}`,
        LABEL_WIDTH + PADDING + barW + 6,
        y + BAR_HEIGHT / 2
      );
    });
  }, [data]);

  if (!data || data.length === 0) return <p className="muted">No spending data yet.</p>;

  return (
    <div className="chart-wrapper">
      <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
    </div>
  );
}
