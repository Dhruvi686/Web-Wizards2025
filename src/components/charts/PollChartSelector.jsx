import React, { useState } from "react";
import { BarChart3, PieChart as PieChartIcon, Donut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PollPieChart, PollDonutChart } from "./PollPieChart";
import { PollBarChart, PollHorizontalBarChart } from "./PollBarChart";

const chartTypes = [
  {
    id: "donut",
    name: "Donut Chart",
    icon: PieChartIcon,
    component: PollDonutChart,
  },
  {
    id: "pie",
    name: "Pie Chart",
    icon: PieChartIcon,
    component: PollPieChart,
  },
  {
    id: "bar",
    name: "Bar Chart",
    icon: BarChart3,
    component: PollBarChart,
  },
  {
    id: "horizontalBar",
    name: "Horizontal Bar",
    icon: BarChart3,
    component: PollHorizontalBarChart,
  },
];

export function PollChartSelector({ pollData, title, description, defaultChart = "donut" }) {
  const [selectedChart, setSelectedChart] = useState(defaultChart);

  const currentChart = chartTypes.find(chart => chart.id === selectedChart);
  const ChartComponent = currentChart?.component || PollDonutChart;

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground mr-2 flex items-center">
          Chart Type:
        </span>
        {chartTypes.map((chart) => {
          const Icon = chart.icon;
          return (
            <Button
              key={chart.id}
              variant={selectedChart === chart.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChart(chart.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {chart.name}
            </Button>
          );
        })}
      </div>

      {/* Selected Chart */}
      <ChartComponent
        pollData={pollData}
        title={title}
        description={description}
      />
    </div>
  );
}