import React, { useMemo } from "react";
import { TrendingUp, BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

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

export function PollBarChart({ pollData, title, description, orientation = "vertical" }) {
  const chartData = useMemo(() => {
    if (!pollData?.options) return [];
    
    return pollData.options.map((option, index) => ({
      id: option.id,
      name: option.text.length > 20 ? option.text.substring(0, 17) + "..." : option.text,
      fullName: option.text,
      votes: option.votes,
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

  const maxVotes = useMemo(() => {
    return Math.max(...chartData.map(d => d.votes), 1);
  }, [chartData]);

  if (!pollData || !chartData.length) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {title || "Poll Results"}
          </CardTitle>
          <CardDescription>{description || "No data available"}</CardDescription>
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
          <BarChart3 className="h-5 w-5" />
          {title || pollData.title}
        </CardTitle>
        <CardDescription>
          {description || `${totalVotes} total votes`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            layout={orientation === "horizontal" ? "horizontal" : "vertical"}
            margin={{
              top: 20,
              right: 30,
              left: orientation === "horizontal" ? 60 : 20,
              bottom: orientation === "vertical" ? 60 : 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {orientation === "vertical" ? (
              <>
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, maxVotes + Math.ceil(maxVotes * 0.1)]}
                />
              </>
            ) : (
              <>
                <XAxis 
                  type="number" 
                  domain={[0, maxVotes + Math.ceil(maxVotes * 0.1)]}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  width={80}
                />
              </>
            )}
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Option
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {data.fullName}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Votes
                          </span>
                          <span className="font-bold" style={{ color: data.fill }}>
                            {data.votes}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar 
              dataKey="votes" 
              fill="var(--color-votes)"
              radius={4}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      {totalVotes > 0 && (
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 leading-none font-medium">
            {winningOption && (
              <>
                Leading: "{winningOption.fullName}" with {winningOption.votes} votes
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

// Horizontal bar chart variant
export function PollHorizontalBarChart({ pollData, title, description }) {
  return (
    <PollBarChart
      pollData={pollData}
      title={title}
      description={description}
      orientation="horizontal"
    />
  );
}