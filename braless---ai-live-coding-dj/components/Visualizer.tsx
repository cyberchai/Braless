import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface VisualizerProps {
  isPlaying: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    
    svg.selectAll("*").remove();

    // Create simplified frequency bars
    const dataCount = 32;
    const data = new Array(dataCount).fill(0);

    const xScale = d3.scaleBand()
      .domain(d3.range(dataCount).map(String))
      .range([0, width])
      .padding(0.2);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    const bars = svg.selectAll("rect")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", (d, i) => xScale(String(i)) || 0)
      .attr("y", height)
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("fill", (d, i) => d3.interpolateCool(i / dataCount));

    let animationId: number;

    const animate = () => {
      if (!isPlaying) {
        // Flatten bars if stopped
        bars.transition().duration(300).attr("y", height).attr("height", 0);
        return;
      }

      // Simulate audio data for visualization since we don't have a real analyser node hooked up to the mock engine securely
      const fakeData = data.map(() => Math.random() * 80 + 10);

      bars
        .data(fakeData)
        .transition()
        .duration(100)
        .ease(d3.easeLinear)
        .attr("y", d => yScale(d))
        .attr("height", d => height - yScale(d))
        .attr("rx", 4)
        .attr("ry", 4);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  return (
    <div className="w-full h-48 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800 shadow-inner relative shadow-[0_0_30px_rgba(139,92,246,0.3)]">
       <div className="absolute top-2 left-2 text-xs text-zinc-500 uppercase font-mono tracking-widest">
          Visualizer Output
       </div>
      <svg ref={svgRef} className="w-full h-full opacity-80" />
    </div>
  );
};

export default Visualizer;