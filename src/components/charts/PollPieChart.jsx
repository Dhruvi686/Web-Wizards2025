import React, { useMemo } from "react";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";
import { Label, Pie, PieChart, ResponsiveContainer } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const generateColors = (count) => {
  const colors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(12, 76%, 61%)",
    "hsl(173, 58%, 39%)",
    "hsl(197, 37%, 24%)",
    "hsl(43, 74%, 66%)",
    "hsl(27, 87%, 67%)",
  ];
  
  return colors.slice(0, count);
};

export function PollPieChart({ pollData, title, description, showLabel = true, innerRadius = 0 }) {
  const chartData = useMemo(() => {
    if (!pollData?.options) return [];
    
    return pollData.options.map((option, index) => ({
      id: option.id,
      name: option.text,
      votes: option.votes || 0,
      fill: generateColors(pollData.options.length)[index],
    }));
  }, [pollData]);

  const chartConfig = useMemo(() => {
    if (!pollData?.options) return {};
    
    const config = {
      votes: {
        label: "Votes",
      },
    };
    
    pollData.options.forEach((option, index) => {
      config[option.id] = {
        label: option.text,
        color: generateColors(pollData.options.length)[index],
      };
    });
    
    return config;
  }, [pollData]);

  const totalVotes = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.votes, 0);
  }, [chartData]);

  const winningOption = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((prev, current) => 
      prev.votes > current.votes ? prev : current
    );
  }, [chartData]);

  if (!pollData) {

    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {title || "Poll Results"}
          </CardTitle>
          <CardDescription>{description || "No data available"}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No poll data available
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            {title || pollData.title}
          </CardTitle>
          <CardDescription>{description || "No votes yet"}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No votes yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          {title || pollData.title}
        </CardTitle>
        <CardDescription>
          {description || `${totalVotes} total votes`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="votes"
              nameKey="name"
              innerRadius={innerRadius}
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {showLabel && innerRadius > 0 && (
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalVotes.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Total Votes
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              )}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      {totalVotes > 0 && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            {winningOption && (
              <>
                Leading: "{winningOption.name}" with {winningOption.votes} votes
                <TrendingUp className="h-4 w-4" />
              </>
            )}
          </div>
          <div className="text-muted-foreground leading-none">
            Real-time results
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

// Donut chart variant
export function PollDonutChart({ pollData, title, description }) {
  return (
    <PollPieChart
      pollData={pollData}
      title={title}
      description={description}
      showLabel={true}
      innerRadius={60}
    />
  );
}