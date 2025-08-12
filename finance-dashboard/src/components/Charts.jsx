import React from 'react';
// import ChartDataLabels from 'chartjs-plugin-datalabels';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
  },
  transitions: {
    active: {
      animation: {
        duration: 0, // Make hover marker appear instantly
      },
    },
  },
  elements: {
    point: {
      radius: 3,
      hoverRadius: 7, // Larger on hover for visibility
      borderWidth: 2,
      hoverBorderWidth: 3, // Thicker border on hover
      backgroundColor: '#fff',
      borderColor: '#6366f1', // Accent color for marker
    },
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(24, 24, 27, 0.95)',
      titleColor: '#fafafa',
      bodyColor: '#a1a1aa',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 12,
      displayColors: false,
      padding: 12,
      titleFont: {
        size: 14,
        weight: '600',
      },
      bodyFont: {
        size: 13,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(63, 63, 70, 0.2)',
        lineWidth: 0.5,
      },
      ticks: {
        color: '#71717a',
        font: {
          size: 12,
          family: 'Inter',
        },
      },
      border: {
        display: false,
      },
    },
    y: {
      grid: {
        display: true,
        color: 'rgba(63, 63, 70, 0.2)',
        lineWidth: 0.5,
      },
      ticks: {
        color: '#71717a',
        font: {
          size: 12,
          family: 'Inter',
        },
      },
      border: {
        display: false,
      },
    },
  },
};

export const LineChart = ({ data, options: customOptions, height = 300 }) => {
  const mergedOptions = {
    ...defaultOptions,
    ...customOptions,
  };

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <Line data={data} options={mergedOptions} />
    </div>
  );
};

export const PieChart = ({ data, options: customOptions, height = 300 }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'var(--text-secondary)',
          font: {
            size: 12,
            family: 'Inter',
          },
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'var(--surface-primary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-secondary)',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        padding: 12,
      },
    },
    borderWidth: 0,
    ...customOptions,
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export const BarChart = ({ data, options: customOptions, height = 300 }) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'var(--surface-primary)',
        titleColor: 'var(--text-primary)',
        bodyColor: 'var(--text-secondary)',
        borderColor: 'var(--border-secondary)',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: false,
        padding: 12,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#71717a',
          font: {
            size: 12,
            family: 'Inter',
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          display: true,
          color: 'rgba(63, 63, 70, 0.2)',
          lineWidth: 0.5,
        },
        ticks: {
          color: '#71717a',
          font: {
            size: 12,
            family: 'Inter',
          },
        },
        border: {
          display: false,
        },
      },
    },
    borderRadius: 8,
    borderSkipped: false,
    ...customOptions,
  };

  return (
    <div style={{ height: `${height}px` }}>
      <Bar data={data} options={options} />
    </div>
  );
};
