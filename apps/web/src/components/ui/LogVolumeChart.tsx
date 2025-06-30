'use client';

import React from 'react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
import { format } from 'date-fns';

// Define the shape of the data expected by the chart
interface ChartDataPoint {
    timestamp: string;
    error: number;
    warn: number;
    info: number;
    log: number;
}

interface LogVolumeChartProps {
    data: ChartDataPoint[];
    isLoading: boolean;
    error: string | null;
    onBarClick?: (timestamp: string | null) => void; // Add optional callback prop
}

// Define colors for each level (using direct hex codes as fallback)
const levelColors = {
    error: '#ef4444', // Red-500
    warn:  '#f97316', // Orange-500
    info:  '#22c55e', // Green-500
    log:   '#3b82f6'  // Blue-500
};

const LogVolumeChart: React.FC<LogVolumeChartProps> = ({ data, isLoading, error, onBarClick }) => {
    if (isLoading) {
        return (
            <div className="flex h-[150px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 text-gray-500">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-400"></div>
                <span className="ml-2 text-sm">Loading chart data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[150px] w-full items-center justify-center rounded-lg border border-dashed border-red-500/40 bg-red-500/10 p-4 text-red-300">
                Error loading chart: {error}
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex h-[150px] w-full items-center justify-center rounded-lg border border-dashed border-white/10 bg-white/5 text-gray-500">
                No volume data available for the selected period.
            </div>
        );
    }

    // Determine the format function based on data density
    const xAxisTickFormat = (timestamp: string) => {
        try {
            return format(new Date(timestamp), data.length > 48 ? 'MMM d' : 'HH:mm');
        } catch (e) {
            console.error("Error formatting axis tick:", timestamp, e);
            return timestamp; // Fallback to original string if formatting fails
        }
    };

    const tooltipFormat = (timestamp: string) => {
        try {
            return format(new Date(timestamp), 'MMM d, HH:mm'); // Consistent detailed format for tooltip
        } catch (e) {
            console.error("Error formatting tooltip timestamp:", timestamp, e);
            return "Invalid Date";
        }
    };

    // --- Custom Tooltip Component (Redesigned) ---
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length && label) { // Added check for label
            let formattedTimestamp = "Invalid Date";
            try {
                // Format timestamp like "Apr 26, 2025, 01:33pm"
                formattedTimestamp = format(new Date(label), 'MMM d, yyyy, hh:mmaaa');
            } catch (e) {
                console.error("Error formatting tooltip timestamp:", label, e);
            }

            // Map internal keys to display names and colors (consistent with levelColors)
            const levelMapping: { [key: string]: { name: string; color: string } } = {
                error: { name: 'Errors', color: levelColors.error },
                warn: { name: 'Warnings', color: levelColors.warn },
                info: { name: 'Ok', color: levelColors.info }, // Map info to Ok (Green)
                log: { name: 'Logs', color: levelColors.log },   // Keep Logs as Logs (Blue)
            };

            // Get the relevant data from the payload
            // Recharts payload can be complex, find the actual data object
            const dataPoint = payload[0]?.payload as ChartDataPoint | undefined;

            return (
                <div className="min-w-[180px] rounded-md border border-gray-700/50 bg-black p-3 text-sm text-gray-200 shadow-lg backdrop-blur-sm">
                    {/* Header: Timestamp */}
                    <div className="mb-2 font-semibold text-gray-100">
                        {formattedTimestamp}
                    </div>
                    {/* List: Level Counts */}
                    <div className="space-y-1">
                        {dataPoint && Object.entries(levelMapping)
                            // Filter or sort levels if needed. Showing all mapped levels for now.
                            // Sort order: Error, Warn, Info (Ok), Log
                            .sort(([keyA], [keyB]) => {
                                const order = ['error', 'warn', 'info', 'log'];
                                return order.indexOf(keyA) - order.indexOf(keyB);
                            })
                            .map(([key, { name, color }]) => {
                                const count = dataPoint[key as keyof ChartDataPoint] ?? 0;
                                // Optionally hide rows with 0 count: if (count === 0) return null;
                                return (
                                    <div key={key} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center">
                                            <span 
                                                className="mr-2 inline-block h-2.5 w-2.5 rounded-sm"
                                                style={{ backgroundColor: color }}
                                            ></span>
                                            <span className="text-gray-300">{name}</span>
                                        </div>
                                        <span className="font-medium text-gray-100">{count}</span>
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            );
        }
        return null;
    };
    // --- End Custom Tooltip ---

    // --- Chart Click Handler ---
    const handleChartClick = (event: any) => {
        console.log('[LogVolumeChart] Chart onClick fired:', event); // Log the whole event
        if (event && event.activePayload && event.activePayload.length > 0 && onBarClick) {
            const timestamp = event.activePayload[0].payload?.timestamp;
            console.log('[LogVolumeChart] Extracted timestamp:', timestamp);
            if (timestamp) {
                 console.log('[LogVolumeChart] Calling onBarClick prop...');
                 onBarClick(timestamp);
            }
        } else if (onBarClick) {
             console.log('[LogVolumeChart] Click detected outside active payload, calling onBarClick(null).');
             // If clicking outside a bar (e.g., on axis/background), clear selection
             // Comment this out if you only want clicks ON bars to do something
             onBarClick(null); // Let's enable clearing by clicking outside for now
        }
    };

    return (
        <div className="h-[150px] w-full rounded-lg border border-white/10 bg-white/5 p-2 backdrop-blur-md">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data} // Use the original data with raw timestamps
                    margin={{ top: 5, right: 5, left: -25, bottom: -5 }} 
                    barGap={1} 
                    barCategoryGap="15%" 
                    onClick={handleChartClick} // Add click handler to the chart
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" vertical={false} />
                    <XAxis
                        dataKey="timestamp" // Use the original timestamp as the key
                        tickFormatter={xAxisTickFormat} // Use the formatter for display
                        tickLine={false}
                        axisLine={false}
                        fontSize={10}
                        stroke="hsl(var(--muted-foreground))"
                        interval="preserveStartEnd" 
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        fontSize={10}
                        stroke="hsl(var(--muted-foreground))"
                        allowDecimals={false}
                        width={25} 
                    />
                    <Tooltip
                        content={<CustomTooltip />} // Tooltip now receives raw timestamp in `label`
                        cursor={{ fill: 'rgba(255, 255, 255, 0.15)' }} // Slightly darker cursor
                    />
                    {/* Stacked Bars */}
                    <Bar dataKey="log" stackId="a" fill={levelColors.log} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="info" stackId="a" fill={levelColors.info} />
                    <Bar dataKey="warn" stackId="a" fill={levelColors.warn} />
                    <Bar dataKey="error" stackId="a" fill={levelColors.error} radius={[2, 2, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default LogVolumeChart; 